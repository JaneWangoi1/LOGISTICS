import { kes } from '../constants';

const PLOT_HEIGHT = 170;

// A simple income-versus-expenses bar chart, drawn with plain HTML so it needs no
// chart library. Hover a bar for its exact figure; the tables on the page carry the same numbers.
export default function GroupedBars({ groups }) {
  const max = Math.max(1, ...groups.flatMap((g) => [g.income, g.expenses]));
  const px = (value) => (value > 0 ? Math.max(Math.round((value / max) * PLOT_HEIGHT), 2) : 0);

  return (
    <div className="chart">
      <div className="chart-legend">
        <span><i className="legend-dot income" /> Income</span>
        <span><i className="legend-dot expense" /> Expenses</span>
      </div>
      <div className="chart-plot">
        {groups.map((g) => (
          <div className="chart-group" key={g.key}>
            <div className="chart-bars" style={{ height: PLOT_HEIGHT }}>
              <div className="chart-bar income" style={{ height: px(g.income) }} title={`${g.label} income: ${kes(g.income)}`} />
              <div className="chart-bar expense" style={{ height: px(g.expenses) }} title={`${g.label} expenses: ${kes(g.expenses)}`} />
            </div>
            <div className="chart-label">{g.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
