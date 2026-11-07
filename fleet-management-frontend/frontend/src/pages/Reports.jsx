import { useEffect, useState } from 'react';
import { getReport } from '../api/reports';
import PeriodPicker, { rangeForPreset, periodParams, periodLabel } from '../components/PeriodPicker';
import GroupedBars from '../components/GroupedBars';
import { downloadCsv } from '../csv';
import { kes, categoryInfo, formatDate } from '../constants';

const marginText = (margin) => (margin == null ? '—' : `${margin}%`);

function monthShort(key) {
  const [year, month] = key.split('-').map(Number);
  const name = new Date(year, month - 1, 1).toLocaleString('en-GB', { month: 'short' });
  return month === 1 ? `${name} ${String(year).slice(2)}` : name;
}

export default function Reports() {
  const [period, setPeriod] = useState(rangeForPreset('month'));
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    getReport(periodParams(period))
      .then(setReport)
      .catch((err) => setError(err.response?.data?.error || 'Could not build the report.'));
  }, [period]);

  function exportCsv() {
    const rows = [
      [`Profit and loss, ${periodLabel(period)}`],
      [],
      ['Truck', 'Income (KES)', 'Expenses (KES)', 'Profit (KES)', 'Margin %'],
      ...report.byTruck.filter((t) => t.income || t.expenses).map((t) => [t.registrationNo, t.income, t.expenses, t.profit, t.margin ?? '']),
      ...(report.unassignedExpenses ? [['General (no truck)', 0, report.unassignedExpenses, -report.unassignedExpenses, '']] : []),
      ['Fleet total', report.totals.income, report.totals.expenses, report.totals.profit, report.totals.margin ?? ''],
      [],
      ['Expense category', 'Total (KES)', 'Share %'],
      ...report.byCategory.map((c) => [categoryInfo(c.category).label, c.total, c.share]),
      [],
      ['Month', 'Income (KES)', 'Expenses (KES)', 'Profit (KES)'],
      ...report.byMonth.map((m) => [m.month, m.income, m.expenses, m.profit]),
    ];
    downloadCsv(`fleet-report-${period.from || 'start'}-to-${period.to || 'today'}.csv`, rows);
  }

  const trucksWithActivity = report ? report.byTruck.filter((t) => t.income > 0 || t.expenses > 0) : [];

  return (
    <>
      <div className="content-header content-header-row">
        <div>
          <h1>Reports</h1>
          <p>Profit and loss for any period.</p>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={exportCsv} disabled={!report}>Export CSV</button>
          <button className="btn-secondary" onClick={() => window.print()} disabled={!report}>Print</button>
        </div>
      </div>

      <div className="print-only print-header">
        <strong>Fleet Manager: profit and loss</strong>
        <div>{periodLabel(period)}. Printed {formatDate(new Date().toISOString().slice(0, 10))}.</div>
      </div>

      <PeriodPicker value={period} onChange={setPeriod} />
      {error && <div className="form-error">{error}</div>}

      {!report ? (!error && <p>Loading…</p>) : (
        <>
          <div className="summary-cards">
            <div className="summary-card"><div className="summary-card-label">Income</div><div className="summary-card-value">{kes(report.totals.income)}</div></div>
            <div className="summary-card"><div className="summary-card-label">Expenses</div><div className="summary-card-value">{kes(report.totals.expenses)}</div></div>
            <div className="summary-card"><div className="summary-card-label">Net profit</div><div className={`summary-card-value ${report.totals.profit >= 0 ? 'positive' : 'negative'}`}>{kes(report.totals.profit)}</div></div>
            <div className="summary-card"><div className="summary-card-label">Margin</div><div className="summary-card-value">{marginText(report.totals.margin)}</div></div>
          </div>
          <p className="report-note">Income is the agreed price of trips that departed in the period (cancelled trips excluded). Customers still owe {kes(report.outstandingPayments)} across all trips.</p>

          <div className="panel report-panel">
            <h3>Income vs expenses by truck</h3>
            {trucksWithActivity.length === 0 ? <div className="empty-state"><p>No activity in this period.</p></div>
              : <GroupedBars groups={trucksWithActivity.map((t) => ({ key: t.truckId, label: t.registrationNo, income: t.income, expenses: t.expenses }))} />}
          </div>

          {report.byMonth.length > 1 && (
            <div className="panel report-panel">
              <h3>Month by month</h3>
              <GroupedBars groups={report.byMonth.map((m) => ({ key: m.month, label: monthShort(m.month), income: m.income, expenses: m.expenses }))} />
            </div>
          )}

          <div className="panel report-panel">
            <h3>Where the money went</h3>
            {report.byCategory.length === 0 ? <div className="empty-state"><p>No expenses in this period.</p></div> : report.byCategory.map((c) => {
              const info = categoryInfo(c.category);
              return (
                <div className="bar-row" key={c.category}>
                  <span>{info.label}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${c.share}%`, '--bar-color': info.color }} /></div>
                  <span className="amount-out">{kes(c.total)}</span>
                  <span className="muted">{c.share}%</span>
                </div>
              );
            })}
          </div>

          <div className="panel report-panel">
            <h3>Profit and loss by truck</h3>
            <div className="table-scroll">
              <table className="data-table static">
                <thead><tr><th>Truck</th><th>Income</th><th>Expenses</th><th>Profit</th><th>Margin</th></tr></thead>
                <tbody>
                  {trucksWithActivity.map((t) => (
                    <tr key={t.truckId}>
                      <td className="plate">{t.registrationNo}</td>
                      <td className="amount-in">{kes(t.income)}</td>
                      <td className="amount-out">{kes(t.expenses)}</td>
                      <td style={{ fontWeight: 500, color: t.profit >= 0 ? 'var(--color-status-good)' : 'var(--color-status-urgent)' }}>{kes(t.profit)}</td>
                      <td>{marginText(t.margin)}</td>
                    </tr>
                  ))}
                  {report.unassignedExpenses > 0 && (
                    <tr>
                      <td className="muted">General (no truck)</td><td>{kes(0)}</td>
                      <td className="amount-out">{kes(report.unassignedExpenses)}</td>
                      <td style={{ color: 'var(--color-status-urgent)', fontWeight: 500 }}>{kes(-report.unassignedExpenses)}</td><td>—</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Fleet total</td><td className="amount-in">{kes(report.totals.income)}</td><td className="amount-out">{kes(report.totals.expenses)}</td>
                    <td style={{ color: report.totals.profit >= 0 ? 'var(--color-status-good)' : 'var(--color-status-urgent)' }}>{kes(report.totals.profit)}</td>
                    <td>{marginText(report.totals.margin)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
