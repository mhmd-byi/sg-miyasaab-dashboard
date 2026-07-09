/**
 * Backfills Report2Item.initialGoldWeight / fineGoldWeight from the Excel
 * "sale resgister" sheet (columns F "N.WT" and H "Fine").
 *
 * Root cause: 24 of 44 report2_items (all "pending"/in-stock items) were
 * seeded with initialGoldWeight = 0 and none of the 44 have fineGoldWeight
 * set, so the app's "Total Gold Weight" KPI undercounts vs. Excel's
 * SUM('sale resgister'!H2:H100).
 *
 * Matching is by tagNo (exact, trimmed). Existing non-zero values are left
 * untouched — this only fills in what's currently 0/missing.
 *
 * Usage:
 *   node scripts/backfill-report2-weights.js            # dry run, prints the diff
 *   node scripts/backfill-report2-weights.js --write     # actually updates MongoDB
 *
 * Requires MONGODB_URI in .env.local (parsed manually, no dotenv dependency).
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

const WRITE = process.argv.includes('--write');
const WORKBOOK_PATH = path.join(__dirname, '..', 'miyaa_saab_dashboard 3005261325.xlsx');
const ENV_PATH = path.join(__dirname, '..', '.env.local');

function loadMongoUri() {
  const env = fs.readFileSync(ENV_PATH, 'utf8');
  const line = env.split(/\r?\n/).find(l => l.startsWith('MONGODB_URI='));
  if (!line) throw new Error('MONGODB_URI not found in .env.local');
  return line.slice('MONGODB_URI='.length).trim();
}

function round3(v) {
  return Math.round(v * 1000) / 1000;
}

function loadSaleRegister() {
  const wb = XLSX.readFile(WORKBOOK_PATH);
  const ws = wb.Sheets['sale resgister'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  const map = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const tag = r && r[1] ? String(r[1]).trim() : '';
    if (!tag) continue;
    map.set(tag, {
      grossWt: typeof r[4] === 'number' ? r[4] : 0,
      netWt: typeof r[5] === 'number' ? r[5] : 0,
      fineWt: typeof r[7] === 'number' ? round3(r[7]) : 0,
    });
  }
  return map;
}

async function main() {
  const registerMap = loadSaleRegister();
  const uri = loadMongoUri();

  await mongoose.connect(uri);
  const collection = mongoose.connection.db.collection('report2_items');
  const items = await collection.find({}).toArray();

  const updates = [];
  const unmatched = [];

  for (const item of items) {
    const row = registerMap.get(String(item.tagNo).trim());
    if (!row) {
      unmatched.push(item.tagNo);
      continue;
    }

    const set = {};
    if (!item.initialGoldWeight && row.netWt) set.initialGoldWeight = row.netWt;
    if (!item.fineGoldWeight && row.fineWt) set.fineGoldWeight = row.fineWt;

    if (Object.keys(set).length > 0) {
      updates.push({ tagNo: item.tagNo, _id: item._id, before: { initialGoldWeight: item.initialGoldWeight, fineGoldWeight: item.fineGoldWeight }, set });
    }
  }

  console.log(`Matched ${items.length - unmatched.length}/${items.length} items to the sale register.`);
  if (unmatched.length) {
    console.log('Unmatched tagNo (skipped):', unmatched.join(', '));
  }
  console.log('');

  if (updates.length === 0) {
    console.log('Nothing to backfill — all items already have non-zero weights.');
  } else {
    console.log(`${updates.length} item(s) will be updated:\n`);
    for (const u of updates) {
      console.log(
        `  ${u.tagNo.padEnd(30)} initialGoldWeight: ${u.before.initialGoldWeight ?? 0} -> ${u.set.initialGoldWeight ?? u.before.initialGoldWeight ?? 0}` +
        `   fineGoldWeight: ${u.before.fineGoldWeight ?? 0} -> ${u.set.fineGoldWeight ?? u.before.fineGoldWeight ?? 0}`
      );
    }

    const totalFineBefore = items.reduce((s, i) => s + (i.fineGoldWeight || i.initialGoldWeight || 0), 0);
    const totalFineAfter = items.reduce((s, i) => {
      const u = updates.find(x => x._id.equals(i._id));
      const fine = u?.set.fineGoldWeight ?? i.fineGoldWeight;
      const initial = u?.set.initialGoldWeight ?? i.initialGoldWeight;
      return s + (fine || initial || 0);
    }, 0);
    console.log(`\nTotal Gold Weight KPI: ${totalFineBefore.toFixed(3)}g -> ${totalFineAfter.toFixed(3)}g`);
  }

  if (WRITE && updates.length > 0) {
    const bulk = collection.initializeUnorderedBulkOp();
    for (const u of updates) {
      bulk.find({ _id: u._id }).updateOne({ $set: u.set });
    }
    const result = await bulk.execute();
    console.log(`\nWrote ${result.modifiedCount} document(s) to MongoDB.`);
  } else if (updates.length > 0) {
    console.log('\nDry run only — no changes written. Re-run with --write to apply.');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
