export const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD', 'SGD'] as const;

export function formatCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined) return '—';
  try {
    const absAmount = Math.abs(amount);
    let minDecimals = 0;
    let maxDecimals = 0;
    if (absAmount > 0 && absAmount % 1 !== 0) {
      if (absAmount < 0.01) {
        minDecimals = 2;
        maxDecimals = 6;
      } else {
        minDecimals = 2;
        maxDecimals = 2;
      }
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  }
}

