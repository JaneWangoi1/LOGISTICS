// Generic status pill: pass the raw enum value plus a small config object
// mapping it to a human label and a color meaning (good/active/attention/
// urgent/neutral). Reused as-is for trip status, payment status, and
// document expiry status from Phase 5 onward — only the config changes.
export const TRUCK_STATUS_CONFIG = {
  AVAILABLE: { label: 'Available', variant: 'good' },
  ON_TRIP: { label: 'On trip', variant: 'active' },
  MAINTENANCE: { label: 'Maintenance', variant: 'attention' },
  INACTIVE: { label: 'Inactive', variant: 'neutral' },
};

export const DRIVER_STATUS_CONFIG = {
  ACTIVE: { label: 'Active', variant: 'good' },
  ON_LEAVE: { label: 'On leave', variant: 'attention' },
  TERMINATED: { label: 'Terminated', variant: 'neutral' },
};

export default function StatusBadge({ status, config }) {
  const entry = config[status] || { label: status, variant: 'neutral' };
  return <span className={`badge-${entry.variant}`}>{entry.label}</span>;
}
