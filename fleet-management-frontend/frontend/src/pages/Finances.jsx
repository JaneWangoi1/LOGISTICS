import { useEffect, useState } from 'react';
import { getFinanceSummary, getProfitByTruck } from '../api/finances';
import { getExpenses, createExpense } from '../api/expenses';
import { getTrucks } from '../api/trucks';
import ExpenseFormModal from '../components/ExpenseFormModal';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Finances() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [byTruck, setByTruck] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => { load(); }, [month]);

  function load() {
    setLoading(true);
    Promise.all([getFinanceSummary(month), getProfitByTruck(month), getExpenses(), getTrucks()])
      .then(([s, bt, exp, tr]) => { setSummary(s); setByTruck(bt); setExpenses(exp); setTrucks(tr); })
      .finally(() => setLoading(false));
  }

  async function handleRecordExpense(data) {
    await createExpense(data);
    setShowExpenseModal(false);
    load();
  }

  const recentExpenses = expenses.slice(0, 8);

  return (
    <>
      <div className="content-header content-header-row">
        <div>
          <h1>Finances</h1>
          <p>Revenue, expenses, and profit for the selected month</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <input type="month" className="month-picker" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn-accent" onClick={() => setShowExpenseModal(true)}>+ Record expense</button>
        </div>
      </div>

      {loading ? <p>Loading…</p> : (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-card-label">Revenue</div>
              <div className="summary-card-value">KES {summary.revenue.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Expenses</div>
              <div className="summary-card-value">KES {summary.expenses.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Net profit</div>
              <div className={`summary-card-value ${summary.profit >= 0 ? 'positive' : 'negative'}`}>KES {summary.profit.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Outstanding (all time)</div>
              <div className="summary-card-value">KES {summary.outstandingPayments.toLocaleString()}</div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.9rem' }}>Profit by truck — {month}</h3>
            {byTruck.length === 0 ? (
              <div className="empty-state"><p>No trucks yet.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Truck</th><th>Revenue</th><th>Expenses</th><th>Profit</th></tr></thead>
                <tbody>
                  {byTruck
                    .slice()
                    .sort((a, b) => b.profit - a.profit)
                    .map((row) => (
                      <tr key={row.truckId} style={{ cursor: 'default' }}>
                        <td className="plate">{row.registrationNo}</td>
                        <td>KES {row.revenue.toLocaleString()}</td>
                        <td>KES {row.expenses.toLocaleString()}</td>
                        <td style={{ color: row.profit >= 0 ? 'var(--color-status-good)' : 'var(--color-status-urgent)', fontWeight: 500 }}>
                          KES {row.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel">
            <h3 style={{ marginBottom: '0.9rem' }}>Recent expenses</h3>
            {recentExpenses.length === 0 ? (
              <div className="empty-state"><p>No expenses recorded yet.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Date</th><th>Category</th><th>Linked to</th><th>Amount</th></tr></thead>
                <tbody>
                  {recentExpenses.map((e) => (
                    <tr key={e.id} style={{ cursor: 'default' }}>
                      <td>{e.expenseDate}</td>
                      <td>{e.category.replace('_', ' ')}</td>
                      <td>{e.Trip ? `${e.Trip.origin} → ${e.Trip.destination}` : e.Truck ? <span className="plate">{e.Truck.registrationNo}</span> : '—'}</td>
                      <td>KES {Number(e.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showExpenseModal && <ExpenseFormModal trucks={trucks} onSave={handleRecordExpense} onClose={() => setShowExpenseModal(false)} />}
    </>
  );
}
