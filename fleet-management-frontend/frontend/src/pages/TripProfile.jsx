import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTrip, updateTrip, deleteTrip, recordPayment, deletePayment } from '../api/trips';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import StatusBadge, { TRIP_STATUS_CONFIG } from '../components/StatusBadge';
import PaymentFormModal from '../components/PaymentFormModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import TripEditModal from '../components/TripEditModal';
import { kes, formatDate, categoryInfo, localISO } from '../constants';

export default function TripProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [returnDate, setReturnDate] = useState(localISO());
  const [working, setWorking] = useState(false);
  const [modal, setModal] = useState(null); // { type: 'payment' | 'expense' | 'edit', expense? }

  useEffect(() => { load(); }, [id]);

  function load(quiet = false) {
    if (!quiet) setLoading(true);
    Promise.all([getTrip(id), getExpenses({ tripId: id })])
      .then(([t, e]) => { setTrip(t); setExpenses(e.expenses); })
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }

  // Runs an action and shows the server's message if it refuses.
  async function run(action) {
    setActionError('');
    setWorking(true);
    try { await action(); } catch (err) { setActionError(err.response?.data?.error || 'That did not work. Please try again.'); }
    setWorking(false);
  }

  const complete = (e) => {
    e.preventDefault();
    run(async () => { await updateTrip(id, { status: 'COMPLETED', actualReturnDate: returnDate }); setCompleting(false); load(true); });
  };
  const cancel = () => {
    if (!window.confirm('Cancel this trip? The truck will be freed up again.')) return;
    run(async () => { await updateTrip(id, { status: 'CANCELLED' }); load(true); });
  };
  const remove = () => {
    if (!window.confirm('Delete this trip and its payments? Expenses recorded against it stay on the books as truck expenses.')) return;
    run(async () => { await deleteTrip(id); navigate('/income', { replace: true }); });
  };
  const savePayment = async (data) => { await recordPayment(id, data); setModal(null); load(true); };
  const removePayment = (p) => {
    if (!window.confirm(`Delete the payment of ${kes(p.amount)}?`)) return;
    run(async () => { await deletePayment(id, p.id); load(true); });
  };
  const saveExpense = async (data) => {
    if (modal.expense) await updateExpense(modal.expense.id, data);
    else await createExpense(data);
    setModal(null);
    load(true);
  };
  const removeExpense = (e) => {
    if (!window.confirm(`Delete this ${categoryInfo(e.category).label.toLowerCase()} expense of ${kes(e.amount)}?`)) return;
    run(async () => { await deleteExpense(e.id); load(true); });
  };
  const saveTrip = async (data) => { await updateTrip(id, data); setModal(null); load(true); };

  if (loading) return <p>Loading…</p>;
  if (notFound) return <div className="panel empty-state"><p>That trip doesn't exist, or may have been removed.</p><Link to="/trips" className="back-link">← Back to trips</Link></div>;

  const payments = trip.Payments || [];
  const received = payments.filter((p) => p.paymentStatus === 'PAID' || p.paymentStatus === 'PARTIAL').reduce((s, p) => s + Number(p.amount), 0);
  // A cancelled trip earns nothing, so it counts no revenue and leaves no balance owed.
  const revenue = trip.status === 'CANCELLED' ? 0 : Number(trip.agreedRevenue);
  const outstanding = Math.max(revenue - received, 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = revenue - totalExpenses;
  const empty = (text) => <p className="muted" style={{ fontSize: '0.9rem' }}>{text}</p>;

  return (
    <>
      <Link to="/trips" className="back-link">← Back to trips</Link>
      <div className="profile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
          <h1>{trip.origin} → {trip.destination}</h1>
          <StatusBadge status={trip.status} config={TRIP_STATUS_CONFIG} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => setModal({ type: 'edit' })}>Edit</button>
          <button className="btn-secondary danger" onClick={remove} disabled={working}>Delete</button>
        </div>
      </div>
      {actionError && <div className="form-error">{actionError}</div>}

      <div className="profile-grid">
        <div className="panel profile-section">
          <h3>Trip details</h3>
          <div className="detail-row"><span className="detail-label">Customer</span><span>{trip.Customer?.name}</span></div>
          <div className="detail-row"><span className="detail-label">Truck</span><Link to={`/trucks/${trip.truckId}`} className="plate cell-link">{trip.Truck?.registrationNo}</Link></div>
          <div className="detail-row"><span className="detail-label">Driver</span><Link to={`/drivers/${trip.driverId}`} className="cell-link">{trip.Driver?.name}</Link></div>
          <div className="detail-row"><span className="detail-label">Cargo</span><span>{trip.cargoDescription || '—'}{trip.cargoWeightTonnes ? ` (${Number(trip.cargoWeightTonnes)} t)` : ''}</span></div>
          <div className="detail-row"><span className="detail-label">Agreed revenue</span><span>{kes(trip.agreedRevenue)}</span></div>
          {trip.notes && <div className="detail-row"><span className="detail-label">Notes</span><span>{trip.notes}</span></div>}
        </div>
        <div className="panel profile-section">
          <h3>Dates</h3>
          <div className="detail-row"><span className="detail-label">Departure</span><span>{formatDate(trip.departureDate)}</span></div>
          <div className="detail-row"><span className="detail-label">Expected return</span><span>{trip.expectedReturnDate ? formatDate(trip.expectedReturnDate) : '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Actual return</span><span>{trip.actualReturnDate ? formatDate(trip.actualReturnDate) : '—'}</span></div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="panel profile-section">
          <div className="section-head">
            <h3 style={{ marginBottom: 0 }}>Payments</h3>
            <button className="btn-secondary" onClick={() => setModal({ type: 'payment' })}>+ Record</button>
          </div>
          {payments.length > 0 ? payments.map((p) => (
            <div className="detail-row" key={p.id}>
              <span>{kes(p.amount)} <span className="detail-label">({p.paymentStatus.toLowerCase()}{p.paymentDate ? `, ${formatDate(p.paymentDate)}` : ''})</span></span>
              <button className="btn-mini danger" onClick={() => removePayment(p)} disabled={working}>Delete</button>
            </div>
          )) : empty('No payments recorded yet.')}
          <div className="detail-row" style={{ fontWeight: 600 }}><span>Outstanding</span><span>{kes(outstanding)}</span></div>
        </div>

        <div className="panel profile-section">
          <div className="section-head">
            <h3 style={{ marginBottom: 0 }}>Expenses</h3>
            <button className="btn-secondary" onClick={() => setModal({ type: 'expense' })}>+ Record</button>
          </div>
          {expenses.length > 0 ? expenses.map((e) => (
            <div className="detail-row" key={e.id}>
              <span>{categoryInfo(e.category).label} <span className="detail-label">{kes(e.amount)}</span></span>
              <span className="row-actions">
                <button className="btn-mini" onClick={() => setModal({ type: 'expense', expense: e })}>Edit</button>
                <button className="btn-mini danger" onClick={() => removeExpense(e)} disabled={working}>Delete</button>
              </span>
            </div>
          )) : empty('No expenses recorded yet.')}
          <div className="detail-row" style={{ fontWeight: 600 }}>
            <span>Trip profit</span>
            <span className={profit >= 0 ? 'amount-in' : 'amount-out'}>{kes(profit)}</span>
          </div>
        </div>
      </div>

      {trip.status === 'ONGOING' && (
        <div className="panel profile-section">
          <h3>Actions</h3>
          {completing ? (
            <form onSubmit={complete}>
              <div className="form-group">
                <label htmlFor="actualReturnDate">Actual return date</label>
                <input id="actualReturnDate" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
              </div>
              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setCompleting(false)}>Cancel</button>
                <button type="submit" className="btn-accent" disabled={working}>{working ? 'Saving…' : 'Confirm complete'}</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn-accent" onClick={() => setCompleting(true)}>Mark complete</button>
              <button className="btn-secondary" onClick={cancel} disabled={working}>Cancel trip</button>
            </div>
          )}
        </div>
      )}

      {modal?.type === 'payment' && <PaymentFormModal onSave={savePayment} onClose={() => setModal(null)} />}
      {modal?.type === 'expense' && <ExpenseFormModal expense={modal.expense} tripId={Number(id)} onSave={saveExpense} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <TripEditModal trip={trip} onSave={saveTrip} onClose={() => setModal(null)} />}
    </>
  );
}
