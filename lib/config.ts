// Edit these labels if the sheet mapping changes
export const REPORT_CONFIG = {
  report1: {
    label: 'MS Design – Gold Ornaments (Parent)',
    description: 'Parent inventory — gold ornaments received from MS Design for selling by Miyasaab · per-item profit split',
    sheetName: 'P&L REPORT 1',
  },
  report2: {
    label: 'SG Design – Sold Ornaments (Child)',
    description: 'Child of MS Design parent inventory — ornaments sold through SG with MBAN/MRING/MBRAC tags · resale profit tracking',
    sheetName: 'P&L REPORT 2',
  },
  report3: {
    label: 'Pure Gold',
    description: 'Pure gold holdings tracked monthly with compounding profit reinvestment',
    sheetName: 'P&L REPORT 3',
  },
  currency: '₨',
  ms: { label: 'MS (Miyasaab)', share: 60, color: '#b45309' },
  sg: { label: 'SG', share: 40, color: '#78716c' },
  operatingCostPct: 15,
};
