export const kes = (amount) => `KES ${Number(amount || 0).toLocaleString()}`;

// Today (or any date) as YYYY-MM-DD in the browser's local time.
export function localISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const EXPENSE_CATEGORIES = [
  { value: 'FUEL', label: 'Fuel', color: '#975617', soft: '#f8ead8' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: '#3a6b8a', soft: '#e2eaf0' },
  { value: 'REPAIRS', label: 'Repairs', color: '#b0483a', soft: '#f6e3e0' },
  { value: 'TOLLS', label: 'Tolls', color: '#7a6a12', soft: '#f3efd2' },
  { value: 'DRIVER_ALLOWANCE', label: 'Driver wages', color: '#6b4f9a', soft: '#ece6f5' },
  { value: 'PERMITS', label: 'Permits & licences', color: '#2f7d7a', soft: '#dcefee' },
  { value: 'PARKING', label: 'Parking', color: '#566070', soft: '#e9e9e7' },
  { value: 'OTHER', label: 'Other', color: '#6b6f76', soft: '#e9e9e7' },
];
export const categoryInfo = (value) =>
  EXPENSE_CATEGORIES.find((c) => c.value === value) || { value, label: value, color: '#6b6f76', soft: '#e9e9e7' };
export const categoryLabel = (value) => categoryInfo(value).label;

export const DOCUMENT_TYPES = [
  { value: 'INSURANCE', label: 'Insurance certificate' },
  { value: 'INSPECTION', label: 'Inspection certificate' },
  { value: 'LOGBOOK', label: 'Logbook' },
  { value: 'PERMIT', label: 'Permit' },
  { value: 'LICENSE', label: 'Licence' },
  { value: 'OTHER', label: 'Other' },
];
export const documentTypeLabel = (value) => DOCUMENT_TYPES.find((d) => d.value === value)?.label || value;

// -1 -> "yesterday", 10 -> "in 10 days", -10 -> "10 days ago"
export function relativeDays(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}
