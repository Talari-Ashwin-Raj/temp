import { useState, useEffect } from 'react';
import ApiClient from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getDashboardStats()
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const data = stats?.overall || stats?.myTasks || { total: 0, todo: 0, in_progress: 0, done: 0 };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="mb-1">Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 dashboard-stats mb-6">
        <div className="glass-card">
          <h4 className="text-muted mb-2">Total Tasks</h4>
          <h2 style={{ fontSize: '2.5rem' }}>{data.total}</h2>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #94a3b8' }}>
          <h4 className="text-muted mb-2">To Do</h4>
          <h2 style={{ fontSize: '2.5rem' }}>{data.todo || 0}</h2>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h4 className="text-muted mb-2">In Progress</h4>
          <h2 style={{ fontSize: '2.5rem' }}>{data.in_progress || 0}</h2>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h4 className="text-muted mb-2">Done</h4>
          <h2 style={{ fontSize: '2.5rem' }}>{data.done || 0}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="glass-card">
          <h3 className="mb-4">Quick Links</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/projects" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              📁 View Projects
            </Link>
            <Link to="/tasks" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              📋 View Task Board
            </Link>
          </div>
        </div>
        
        <div className="glass-card">
          <h3 className="mb-4">System Information</h3>
          <p className="text-sm text-muted mb-2">Your current role: <span className={`badge badge-${user?.role}`}>{user?.role}</span></p>
          <ul className="text-sm" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <li>You can view tasks assigned to you</li>
            <li>You can update statuses and add comments</li>
            {user?.role !== 'member' && <li>You can create projects and assign tasks</li>}
            {user?.role === 'admin' && <li>You have full system access</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
