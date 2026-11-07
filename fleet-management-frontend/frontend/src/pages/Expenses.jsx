import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import { getTrucks } from '../api/trucks';
import ExpenseFormModal from '../components/ExpenseFormModal';
import { kes, formatDate, EXPENSE_CATEGORIES, categoryInfo } from '../constants';

const pillStyle = (category) => {
  const c = categoryInfo(category);
  return { '--chip-color': c.color, '--chip-soft': c.soft };
};

export default function Expenses() {
  const [trucks, setTrucks] = useState([]);
  const [filters, setFilters] = useState({ truckId: '', category: '', from: '', to: '' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { expense } to edit, {} to add

  useEffect(() => { getTrucks().then(setTrucks); }, []);
  useEffect(() => { load(); }, [filters]);

  function load() {
    setError('');
    getExpenses(filters).then(setData).catch((err) => setError(err.response?.data?.error || 'Could not load expenses.'));
  }

  const setFilter = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const filtered = Boolean(filters.truckId || filters.category || filters.from || filters.to);
  const toggleCategory = (value) => setFilters({ ...filters, category: filters.category === value ? '' : value });

  async function handleSave(values) {
    if (modal.expense) await updateExpense(modal.expense.id, values);
    else await createExpense(values);
    setModal(null);
    load();
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete this ${categoryInfo(expense.category).label.toLowerCase()} expense of ${kes(expense.amount)}?`)) return;
    await deleteExpense(expense.id);
    load();
  }

  const chips = data ? EXPENSE_CATEGORIES.filter((c) => data.byCategory[c.value] || filters.category === c.value) : [];

  return (
    <>
      <div className="content-header content-header-row">
        <div>
          <h1>Expenses</h1>
          <p>Fuel, repairs, tolls, wages and every other cost. Click a category to filter.</p>
        </div>
        {data && <div className="total-line amount-out">{kes(data.total)}<small>{data.count} {data.count === 1 ? 'entry' : 'entries'}</small></div>}
      </div>

      {data && (
        <div className="chips">
          {chips.map((c) => (
            <button key={c.value} type="button" className={`chip${filters.category === c.value ? ' active' : ''}`} style={pillStyle(c.value)} onClick={() => toggleCategory(c.value)}>
              {c.label} <strong>{kes(data.byCategory[c.value] || 0)}</strong>
            </button>
          ))}
        </div>
      )}

      <div className="toolbar">
        <select name="truckId" value={filters.truckId} onChange={setFilter} aria-label="Filter by truck">
          <option value="">All trucks</option>
          {trucks.map((t) => <option key={t.id} value={t.id}>{t.registrationNo}</option>)}
        </select>
        <select name="category" value={filters.category} onChange={setFilter} aria-label="Filter by category">
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label>From <input type="date" name="from" value={filters.from} onChange={setFilter} /></label>
        <label>To <input type="date" name="to" value={filters.to} onChange={setFilter} /></label>
        {filtered && <button className="btn-mini" onClick={() => setFilters({ truckId: '', category: '', from: '', to: '' })}>Clear filters</button>}
        <span className="spacer" />
        <button className="btn-accent" onClick={() => setModal({})}>+ Log expense</button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        {!data ? <p>Loading…</p> : data.expenses.length === 0 ? (
          <div className="empty-state"><p>{filtered ? 'No expenses match these filters.' : 'No expenses logged yet.'}</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table static">
              <thead><tr><th>Date</th><th>Truck</th><th>Category</th><th>Amount</th><th>Notes</th><th /></tr></thead>
              <tbody>
                {data.expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="mono-cell">{formatDate(e.expenseDate)}</td>
                    <td>{e.Truck ? <span className="plate">{e.Truck.registrationNo}</span> : <span className="muted">General</span>}</td>
                    <td><span className="cat-pill" style={pillStyle(e.category)}>{categoryInfo(e.category).label}</span></td>
                    <td className="amount-out">{kes(e.amount)}</td>
                    <td>
                      {e.description || <span className="muted">&mdash;</span>}
                      {e.Trip && <div className="cell-sub">Trip: <Link to={`/trips/${e.Trip.id}`} className="cell-link">{e.Trip.origin} → {e.Trip.destination}</Link></div>}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-mini" onClick={() => setModal({ expense: e })}>Edit</button>
                        <button className="btn-mini danger" onClick={() => handleDelete(e)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="3">Total{filtered ? ' (filtered)' : ''}</td><td className="amount-out">{kes(data.total)}</td><td colSpan="2" /></tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {modal && <ExpenseFormModal expense={modal.expense} trucks={trucks} onSave={handleSave} onClose={() => setModal(null)} />}
    </>
  );
}
