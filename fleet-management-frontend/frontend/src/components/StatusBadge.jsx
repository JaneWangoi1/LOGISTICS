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

export const TRIP_STATUS_CONFIG = {
  ONGOING: { label: 'Ongoing', variant: 'active' },
  COMPLETED: { label: 'Completed', variant: 'good' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },
};

export const DOCUMENT_STATUS_CONFIG = {
  VALID: { label: 'Valid', variant: 'good' },
  EXPIRING_SOON: { label: 'Expiring soon', variant: 'attention' },
  EXPIRED: { label: 'Expired', variant: 'urgent' },
};

export const MAINTENANCE_STATUS_CONFIG = {
  DUE: { label: 'Due', variant: 'attention' },
  OK: { label: 'OK', variant: 'good' },
  SUPERSEDED: { label: 'Superseded', variant: 'neutral' },
};

// The due / superseded flags are worked out by the backend, so every page agrees.
export const maintenanceState = (record) => (record.superseded ? 'SUPERSEDED' : record.due ? 'DUE' : 'OK');

export default function StatusBadge({ status, config }) {
  const entry = config[status] || { label: status, variant: 'neutral' };
  return <span className={`badge-${entry.variant}`}>{entry.label}</span>;
}
