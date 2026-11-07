import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../api/dashboard';
import PeriodPicker, { rangeForPreset, periodParams, periodLabel } from '../components/PeriodPicker';
import { kes, categoryInfo, documentTypeLabel, relativeDays } from '../constants';

const UNPAID_SHOWN = 5;

// Turns the API's grouped alerts into one flat list, most urgent first.
function buildAttention(a) {
  const document = (d, expired) => ({
    key: `doc-${d.id}`,
    variant: expired ? 'urgent' : 'attention',
    label: expired ? 'Expired' : 'Expiring soon',
    to: `/trucks/${d.truckId}`,
    title: <><span className="plate">{d.registrationNo}</span><span className="attention-detail">{documentTypeLabel(d.documentType)}</span></>,
    meta: `${expired ? 'expired' : 'expires'} ${relativeDays(d.daysLeft)}`,
  });
  const licence = (l) => {
    const expired = l.status === 'EXPIRED';
    return {
      key: `licence-${l.driverId}`,
      variant: expired ? 'urgent' : 'attention',
      label: expired ? 'Expired' : 'Expiring soon',
      to: `/drivers/${l.driverId}`,
      title: <><span>{l.name}</span><span className="attention-detail">driving licence</span></>,
      meta: `${expired ? 'expired' : 'expires'} ${relativeDays(l.daysLeft)}`,
    };
  };

  return [
    ...a.expiredDocuments.map((d) => document(d, true)),
    ...a.licences.filter((l) => l.status === 'EXPIRED').map(licence),
    ...a.expiringDocuments.map((d) => document(d, false)),
    ...a.licences.filter((l) => l.status !== 'EXPIRED').map(licence),
    ...a.serviceDue.map((s) => ({
      key: `service-${s.truckId}-${s.serviceType}`,
      variant: 'attention',
      label: 'Service due',
      to: `/trucks/${s.truckId}`,
      title: <><span className="plate">{s.registrationNo}</span><span className="attention-detail">{s.serviceType}</span></>,
      meta: 'due for service',
    })),
    ...a.unpaidTrips.slice(0, UNPAID_SHOWN).map((t) => ({
      key: `trip-${t.tripId}`,
      variant: t.tripStatus === 'COMPLETED' ? 'attention' : 'neutral',
      label: 'Unpaid',
      to: `/trips/${t.tripId}`,
      title: <><span>{t.customer}</span><span className="attention-detail">{t.origin} → {t.destination}</span></>,
      meta: `${kes(t.outstanding)}${t.tripStatus === 'ONGOING' ? ', trip in progress' : ''}`,
    })),
  ];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(rangeForPreset('month'));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    getDashboard(periodParams(period))
      .then(setData)
      .catch((err) => setError(err.response?.data?.error || 'Could not load the dashboard. Check that the backend is running, then refresh.'));
  }, [period]);

  if (error && !data) return <div className="panel empty-state"><p>{error}</p></div>;
  if (!data) return <p>Loading…</p>;

  const { fleet, finance, highlights, attention } = data;
  const items = buildAttention(attention);
  const hiddenUnpaid = Math.max(attention.unpaidTrips.length - UNPAID_SHOWN, 0);
  const alertTotal = items.length + hiddenUnpaid;
  const { topTruck, topExpenseCategory } = highlights;

  const tiles = [
    { label: 'Total trucks', value: fleet.total, color: 'var(--color-graphite)' },
    { label: 'Available', value: fleet.available, color: 'var(--color-status-good)' },
    { label: 'On trip', value: fleet.onTrip, color: 'var(--color-status-active)' },
    { label: 'Maintenance', value: fleet.maintenance, color: 'var(--color-status-attention)' },
    { label: 'Inactive', value: fleet.inactive, color: 'var(--color-status-neutral)' },
  ];

  return (
    <>
      <div className="content-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}. Here is where things stand.</p>
      </div>

      <div className="section-head">
        <h2>Fleet</h2>
        <Link to="/trucks" className="section-link">View trucks</Link>
      </div>
      <div className="stat-strip">
        {tiles.map((tile) => (
          <Link to="/trucks" key={tile.label} className="stat-tile" style={{ '--tile-color': tile.color }}>
            <div className="stat-tile-label">{tile.label}</div>
            <div className="stat-tile-value">{tile.value}</div>
          </Link>
        ))}
      </div>

      <div className="section-head">
        <h2>Finances <span className="section-sub">{periodLabel(period)}</span></h2>
        <Link to="/reports" className="section-link">Full reports</Link>
      </div>
      <PeriodPicker value={period} onChange={setPeriod} />
      {error && <div className="form-error">{error}</div>}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-label">Income</div>
          <div className="summary-card-value">{kes(finance.income)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Expenses</div>
          <div className="summary-card-value">{kes(finance.expenses)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Net profit</div>
          <div className={`summary-card-value ${finance.profit >= 0 ? 'positive' : 'negative'}`}>{kes(finance.profit)}</div>
          <div className="summary-card-sub">{finance.margin == null ? 'No income in this period' : `${finance.margin}% margin`}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Outstanding (all time)</div>
          <div className="summary-card-value">{kes(finance.outstandingPayments)}</div>
          <div className="summary-card-sub">owed by customers</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="section-head">
            <h2>Needs attention</h2>
            <span className="section-sub">{alertTotal === 0 ? '' : `${alertTotal} ${alertTotal === 1 ? 'item' : 'items'}`}</span>
          </div>
          {items.length === 0 ? (
            <div className="all-clear"><span aria-hidden="true">✓</span> Nothing needs attention right now.</div>
          ) : (
            <ul className="attention-list">
              {items.map((item) => (
                <li key={item.key}>
                  <Link to={item.to} className="attention-item">
                    <span className="attention-badge-cell"><span className={`badge-${item.variant}`}>{item.label}</span></span>
                    <span className="attention-title">{item.title}</span>
                    <span className="attention-meta">{item.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {hiddenUnpaid > 0 && (
            <p className="attention-more">+ {hiddenUnpaid} more unpaid {hiddenUnpaid === 1 ? 'trip' : 'trips'}. <Link to="/income" className="section-link">See all income</Link></p>
          )}
        </div>

        <div className="panel">
          <div className="section-head"><h2>Highlights</h2></div>
          <div className="highlight">
            <div className="highlight-label">Top performing truck</div>
            {topTruck ? (
              <>
                <div className="highlight-main plate">{topTruck.registrationNo}</div>
                <div className={`highlight-sub ${topTruck.profit >= 0 ? 'positive' : 'negative'}`}>{kes(topTruck.profit)} profit</div>
              </>
            ) : <div className="highlight-empty">No activity in this period</div>}
          </div>
          <div className="highlight">
            <div className="highlight-label">Biggest expense</div>
            {topExpenseCategory ? (
              <>
                <div className="highlight-main" style={{ color: categoryInfo(topExpenseCategory.category).color }}>{categoryInfo(topExpenseCategory.category).label}</div>
                <div className="highlight-sub">{kes(topExpenseCategory.total)}, {topExpenseCategory.share}% of spending</div>
              </>
            ) : <div className="highlight-empty">No expenses in this period</div>}
          </div>
        </div>
      </div>
    </>
  );
}
