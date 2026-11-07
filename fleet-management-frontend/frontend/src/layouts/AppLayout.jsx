import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlertCount } from '../api/dashboard';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', code: 'DB', end: true },
  { to: '/trucks', label: 'Trucks', code: 'TK' },
  { to: '/drivers', label: 'Drivers', code: 'DV' },
  { to: '/trips', label: 'Trips', code: 'TP' },
  { to: '/income', label: 'Income', code: 'IN' },
  { to: '/expenses', label: 'Expenses', code: 'EX' },
  { to: '/compliance', label: 'Compliance', code: 'CP', badge: true },
  { to: '/reports', label: 'Reports', code: 'RP' },
];

const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alerts, setAlerts] = useState(0);
  // Phones start with the sidebar hidden; on desktop it remembers your last choice.
  const [collapsed, setCollapsed] = useState(() => {
    try { return isMobile() || localStorage.getItem('sidebar-collapsed') === '1'; } catch { return isMobile(); }
  });

  // Re-count on every page change so the badge stays current after you add or fix a document.
  useEffect(() => { getAlertCount().then(setAlerts).catch(() => {}); }, [location.pathname]);

  // On a phone, close the drawer after you tap a link.
  useEffect(() => { if (isMobile()) setCollapsed(true); }, [location.pathname]);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    if (!isMobile()) {
      try { localStorage.setItem('sidebar-collapsed', next ? '1' : '0'); } catch { /* storage unavailable */ }
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Open menu' : 'Close menu'}
        aria-expanded={!collapsed}
      >
        {collapsed ? '☰' : '‹'}
      </button>
      {!collapsed && <button className="sidebar-backdrop" onClick={toggleSidebar} aria-label="Close menu" />}
      <aside className="sidebar">
        <div className="sidebar-mark">
          <span className="login-mark-glyph">FM</span>
          <span className="sidebar-mark-text">Fleet Manager</span>
        </div>
        <ul className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                <span className="sidebar-icon">{item.code}</span>
                {item.label}
                {item.badge && alerts > 0 && <span className="nav-badge" title={`${alerts} items need attention`}>{alerts}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
