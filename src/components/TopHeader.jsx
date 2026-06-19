import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';

export default function TopHeader({ title }) {
  const [clock, setClock] = useState('');
  const navigate = useNavigate();
  const { db, setSidebarOpen } = useDatabase();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  const stats = db.getGlobalStats();
  const notifCount = stats.warningOutletsCount + stats.criticalOutletsCount;

  return (
    <header className="top-header">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center' }}>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <i className="fa-solid fa-bars"></i>
        </button>
        <h2>{title}</h2>
      </div>
      <div className="header-actions">
        <div className="date-time">
          <i className="fa-regular fa-clock"></i>
          <span>{clock}</span>
        </div>
        <div className="bell-notification" onClick={() => navigate('/command-center')}>
          <i className="fa-regular fa-bell"></i>
          <span className="bell-badge">{notifCount}</span>
        </div>
        <div className="user-profile">
          <div className="user-avatar">AD</div>
          <div className="user-info">
            <span className="user-name">Admin Control</span>
            <span className="user-role">Martinoz Corporate HQ</span>
          </div>
        </div>
      </div>
    </header>
  );
}
