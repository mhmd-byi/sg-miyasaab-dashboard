import { calcR1 } from './calculations';

// Builds the persisted Report 1 fields from a request body.
// Stock entries only carry identity + weight; every rate/profit field is zeroed.
export function buildR1Fields(b: Record<string, unknown>) {
  const status = b.status === 'stock' ? 'stock' : 'sold';
  const base = {
    status,
    tagNo: String(b.tagNo ?? '').trim(),
    stockDate: String(b.stockDate ?? '').trim(),
    goldWeightG: Number(b.goldWeightG ?? 0),
    purity: Number(b.purity ?? 22),
  };

  if (status === 'stock') {
    return {
      ...base,
      salesDate: '',
      goldRate22K: 0,
      labourRatePct: 0,
      labourCostPrice: 0,
      labourCostCharged: 0,
      ...calcR1(0, 0, 0, 0),
    };
  }

  const goldRate22K = Number(b.goldRate22K ?? 0);
  const labourRatePct = Number(b.labourRatePct ?? 0);
  const labourCostCharged = Number(b.labourCostCharged ?? 0);
  return {
    ...base,
    salesDate: String(b.salesDate ?? ''),
    goldRate22K,
    labourRatePct,
    labourCostPrice: 0,
    labourCostCharged,
    ...calcR1(base.goldWeightG, goldRate22K, labourRatePct, labourCostCharged),
  };
}
