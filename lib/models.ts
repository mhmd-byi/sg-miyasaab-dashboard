import mongoose, { Schema, type Model } from 'mongoose';

// ── Shared: MonthRow subdocument ─────────────────────────────────────────────

const MonthRowSchema = new Schema(
  {
    month: String,
    cumulativeGoldWeight: Number,
    salesPM: Number,
    goldRate24K: Number,
    labourCostPrice: Number,
    labourCostCharged: Number,
    labourSellPrice: Number,
    labourProfitCharged: Number,
    labourSharableProfit: Number,
    operatingCost: Number,
    msShare: Number,
    sgShare: Number,
    msProfitInGold: Number,
  },
  { _id: false },
);

// ── Report 1: Ornaments Sold ─────────────────────────────────────────────────

const Report1Schema = new Schema(
  {
    tagNo: String,
    salesDate: String,
    goldWeightG: Number,
    goldRate22K: Number,
    purity: Number,
    labourRatePct: { type: Number, default: 0 },
    labourCostPrice: Number,
    labourCostCharged: Number,
    goldSellPrice: Number,
    labourProfitCharged: Number,
    labourSharableProfit: Number,
    operatingCost: Number,
    msShare: Number,
    sgShare: Number,
  },
  { collection: 'report1_items', versionKey: false },
);

// ── Report 2: Ornaments + Inventory ─────────────────────────────────────────

const Report2Schema = new Schema(
  {
    srNo: Number,
    tagNo: String,
    salesDate: String,
    purity: String,
    initialGoldWeight: Number,
    status: { type: String, enum: ['sold', 'pending'] },
    months: [MonthRowSchema],
    totalMsShare: Number,
    totalSgShare: Number,
    totalOperatingCost: Number,
  },
  { collection: 'report2_items', versionKey: false },
);

// ── Report 3: Pure Gold ───────────────────────────────────────────────────────

const Report3Schema = new Schema(
  {
    initialGoldWeight: Number,
    months: [MonthRowSchema],
  },
  { collection: 'report3', versionKey: false },
);

// ── Users ─────────────────────────────────────────────────────────────────────

const UserSchema = new Schema(
  {
    username: { type: String, unique: true, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'system' },
  },
  { collection: 'users', versionKey: false },
);

// ── Model exports ─────────────────────────────────────────────────────────────
// Use Model<unknown> so TS accepts .find()/.lean() etc. in API routes.
// Guard against hot-reload re-registration with nullish coalescing.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = Model<any>;

export const Report1Model: AnyModel =
  (mongoose.models['Report1Item'] as AnyModel) ??
  mongoose.model('Report1Item', Report1Schema);

export const Report2Model: AnyModel =
  (mongoose.models['Report2Item'] as AnyModel) ??
  mongoose.model('Report2Item', Report2Schema);

export const Report3Model: AnyModel =
  (mongoose.models['Report3'] as AnyModel) ??
  mongoose.model('Report3', Report3Schema);

export const UserModel: AnyModel =
  (mongoose.models['User'] as AnyModel) ??
  mongoose.model('User', UserSchema);
