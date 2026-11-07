import { localISO, formatDate } from '../constants';

const PRESETS = [
  { key: 'month', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'year', label: 'This year' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
];

export function rangeForPreset(key) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'month': return { key, from: localISO(new Date(y, m, 1)), to: localISO(new Date(y, m + 1, 0)) };
    case 'lastMonth': return { key, from: localISO(new Date(y, m - 1, 1)), to: localISO(new Date(y, m, 0)) };
    case 'year': return { key, from: localISO(new Date(y, 0, 1)), to: localISO(new Date(y, 11, 31)) };
    default: return { key: 'all', from: '', to: '' };
  }
}

// Query parameters for the API. A blank end means "no limit on that side".
export const periodParams = (period) => ({ from: period.from || '', to: period.to || '' });

export function periodLabel({ from, to }) {
  if (!from && !to) return 'All time';
  if (from && to) return `${formatDate(from)} to ${formatDate(to)}`;
  return from ? `From ${formatDate(from)}` : `Up to ${formatDate(to)}`;
}

// A row of period buttons (this month, last month, this year, all time) plus a custom date range.
export default function PeriodPicker({ value, onChange }) {
  return (
    <div className="period-picker no-print">
      <div className="filter-tabs">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={`filter-tab${value.key === preset.key ? ' active' : ''}`}
            onClick={() => onChange(preset.key === 'custom' ? { ...value, key: 'custom' } : rangeForPreset(preset.key))}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {value.key === 'custom' && (
        <div className="period-custom">
          <label>From <input type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} /></label>
          <label>To <input type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} /></label>
        </div>
      )}
    </div>
  );
}
