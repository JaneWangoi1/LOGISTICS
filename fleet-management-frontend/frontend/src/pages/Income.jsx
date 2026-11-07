import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getIncome } from '../api/income';
import { getTrucks } from '../api/trucks';
import { updateTrip, deleteTrip } from '../api/trips';
import TripEditModal from '../components/TripEditModal';
import { kes, formatDate } from '../constants';

export default function Income() {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState([]);
  const [filters, setFilters] = useState({ truckId: '', from: '', to: '' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => { getTrucks().then(setTrucks); }, []);
  useEffect(() => { load(); }, [filters]);

  function load() {
    setError('');
    getIncome(filters).then(setData).catch((err) => setError(err.response?.data?.error || 'Could not load income.'));
  }

  const setFilter = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const filtered = Boolean(filters.truckId || filters.from || filters.to);

  async function handleSave(values) {
    await updateTrip(editing.id, values);
    setEditing(null);
    load();
  }

  async function handleDelete(entry) {
    const message = `Delete ${entry.origin} to ${entry.destination} (${kes(entry.amount)})?\n\nIts payments are deleted too. Expenses recorded against it stay on the books as truck expenses.`;
    if (!window.confirm(message)) return;
    await deleteTrip(entry.id);
    load();
  }

  return (
    <>
      <div className="content-header content-header-row">
        <div>
          <h1>Income</h1>
          <p>Every trip is an income entry. Log a trip that has already finished, or book a live one from Trips.</p>
        </div>
        {data && <div className="total-line amount-in">{kes(data.total)}<small>{data.count} {data.count === 1 ? 'entry' : 'entries'}</small></div>}
      </div>

      <div className="toolbar">
        <select name="truckId" value={filters.truckId} onChange={setFilter} aria-label="Filter by truck">
          <option value="">All trucks</option>
          {trucks.map((t) => <option key={t.id} value={t.id}>{t.registrationNo}</option>)}
        </select>
        <label>From <input type="date" name="from" value={filters.from} onChange={setFilter} /></label>
        <label>To <input type="date" name="to" value={filters.to} onChange={setFilter} /></label>
        {filtered && <button className="btn-mini" onClick={() => setFilters({ truckId: '', from: '', to: '' })}>Clear filters</button>}
        <span className="spacer" />
        <button className="btn-accent" onClick={() => navigate('/trips/new?logged=1')}>+ Log income</button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        {!data ? <p>Loading…</p> : data.entries.length === 0 ? (
          <div className="empty-state"><p>{filtered ? 'No income matches these filters.' : 'No income logged yet. Use Log income for a trip that has finished.'}</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table static">
              <thead><tr><th>Date</th><th>Truck</th><th>Route / client</th><th>Amount</th><th>Balance</th><th /></tr></thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="mono-cell">{formatDate(e.departureDate)}</td>
                    <td className="plate">{e.registrationNo}</td>
                    <td>
                      <Link to={`/trips/${e.id}`} className="cell-link">{e.origin} → {e.destination}</Link>
                      <div className="cell-sub">{e.customer}{e.notes ? `, ${e.notes}` : ''}</div>
                    </td>
                    <td className="amount-in">{kes(e.amount)}</td>
                    <td>{e.balance > 0 ? <span className="amount-owed">{kes(e.balance)}</span> : <span className="muted">Paid</span>}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-mini" onClick={() => setEditing(e)}>Edit</button>
                        <button className="btn-mini danger" onClick={() => handleDelete(e)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">Total{filtered ? ' (filtered)' : ''}</td>
                  <td className="amount-in">{kes(data.total)}</td>
                  <td className="amount-owed">{kes(data.outstanding)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {editing && <TripEditModal trip={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </>
  );
}
