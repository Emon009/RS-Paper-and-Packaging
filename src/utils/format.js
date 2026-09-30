// Utility helper functions for formatting

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '৳ ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

export function formatQty(amount, unit = 'কেজি') {
  const num = Number(amount) || 0;
  return `${num.toLocaleString('en-IN')} ${unit}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}
