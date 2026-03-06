export function fmtCurrency(amount, currency = 'INR') {
  const num = parseFloat(amount) || 0
  const symbol = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ' }[currency] || currency + ' '
  return symbol + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function truncate(str, len = 40) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}
