import { NavLink, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';

const NAV_ITEMS = [
  { to: '/', icon: 'fa-chart-line', label: 'CEO Dashboard', end: true },
  { to: '/command-center', icon: 'fa-network-wired', label: 'Command Center' },
  { to: '/forecasting', icon: 'fa-brain', label: 'AI Forecasting' },
  { to: '/crm', icon: 'fa-ticket', label: 'Complaint CRM' },
  { to: '/compliance', icon: 'fa-shield-halved', label: 'Hygiene Audit' },
  { to: '/copilot', icon: 'fa-wand-magic-sparkles', label: 'AI Copilot' },
  { to: '/sku-dashboard', icon: 'fa-boxes-stacked', label: 'SKU Dashboard' },
  { to: '/logistics-kds', icon: 'fa-truck-ramp-box', label: 'Logistics & KDS' },
  { to: '/centralized-dashboard', icon: 'fa-globe', label: 'Centralized Ops' },
  { to: '/ai-billing', icon: 'fa-cash-register', label: 'AI Billing POS' },
  { to: '/waste-management', icon: 'fa-recycle', label: 'Waste Management' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { db, isSidebarOpen, setSidebarOpen } = useDatabase();

  return (
    <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
        <i className="fa-solid fa-xmark"></i>
      </button>
      <div className="sidebar-logo" style={{ borderBottom: '1px solid var(--border-glass)' }}>
        <i className="fa-solid fa-pizza-slice"></i>
        <span>Martinoz<span className="dot">.</span>HQ</span>
      </div>
      <nav className="nav-links">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>Martinoz FIP v2.0</p>
        <p>HQ Operations Control</p>
      </div>
    </aside>
  );
}
