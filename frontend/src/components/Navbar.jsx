import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="brand">
        TaskHandler
      </div>
      <div className="nav-links">
        <Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard">Dashboard</Link>
        <Link className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`} to="/projects">Projects</Link>
        <Link className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`} to="/tasks">Tasks</Link>
        
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 10px' }}></div>
        
        <NotificationsDropdown />
        
        <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.username}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
