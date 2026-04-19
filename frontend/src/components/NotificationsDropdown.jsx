import { useState, useEffect } from 'react';
import ApiClient from '../api/api';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await ApiClient.getNotifications();
      setNotifications(data.data.notifications || []);
      setUnreadCount(data.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 10 seconds for new notifications
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await ApiClient.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.markAllNotificationsRead();
      fetchNotifications();
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-secondary" 
        style={{ padding: '0.4rem 0.6rem', position: 'relative' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'var(--danger)',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="glass-card" style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '320px',
            zIndex: 50,
            padding: '0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Notifications</h4>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Mark all read
                </button>
              )}
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No notifications
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{ 
                    padding: '12px 15px', 
                    borderBottom: '1px solid var(--border-color)',
                    background: n.is_read === 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                  }}>
                    <div style={{ fontSize: '0.875rem' }}>{n.message}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      {n.is_read === 0 && (
                        <button 
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
