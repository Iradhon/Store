export function formatMoney(amountMinor: number, currency: string): string {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    })
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2
    return formatter.format(amountMinor / (10 ** fractionDigits))
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`
  }
}
