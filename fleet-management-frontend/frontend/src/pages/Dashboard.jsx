import { useAuth } from '../context/AuthContext';

// The real dashboard (fleet overview, financial overview, attention-required
// alerts) is Phase 8 on purpose — it pulls numbers from every other module,
// so it's built last. For now this just confirms login worked and orients
// you to what's where.
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <div className="content-header">
        <h1>Welcome, {user?.name}</h1>
        <p>Signed in as {user?.email} · {user?.role}</p>
      </div>
      <div className="panel placeholder-panel">
        <span className="placeholder-phase">Phase 8</span>
        <h2>The real dashboard lands last, on purpose</h2>
        <p>
          Fleet status, this month's revenue and expenses, and the
          attention-required alerts all pull from the other five modules —
          so building this screen properly means building those first.
          Use the sidebar to see where each one stands.
        </p>
      </div>
    </>
  );
}
