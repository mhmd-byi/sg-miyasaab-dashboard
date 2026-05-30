import { REPORT_CONFIG } from './config';

export function fmt(amount: number): string {
  return `${REPORT_CONFIG.currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtGold(grams: number): string {
  return `${grams.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}g`;
}

export function fmtRate(rate: number): string {
  return rate.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
