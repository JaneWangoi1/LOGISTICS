import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', code: 'DB', end: true },
  { to: '/trucks', label: 'Trucks', code: 'TK' },
  { to: '/drivers', label: 'Drivers', code: 'DV' },
  { to: '/trips', label: 'Trips', code: 'TP' },
  { to: '/finances', label: 'Finances', code: 'FN' },
  { to: '/documents', label: 'Documents & Maintenance', code: 'DM' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-mark">
          <span className="login-mark-glyph">FM</span>
          <span className="sidebar-mark-text">Fleet Manager</span>
        </div>

        <ul className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-icon">{item.code}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="content">
        {/* Each module page renders here via nested routing (see App.jsx) */}
        <Outlet />
      </main>
    </div>
  );
}
