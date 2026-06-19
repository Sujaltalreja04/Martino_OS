import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import TiltCard from '../components/TiltCard';

const CITY_FILTERS = [
  { label: 'All Cities', value: 'all' },
  { label: 'Surat', value: 'surat' },
  { label: 'Ahmedabad', value: 'ahmedabad' },
  { label: 'Vadodara', value: 'vadodara' },
  { label: 'Navsari', value: 'navsari' },
  { label: 'Bopal', value: 'bopal' },
  { label: 'Others', value: 'others' },
];
const MAIN_CITIES = ['Surat', 'Ahmedabad', 'Vadodara', 'Navsari', 'Bopal'];

export default function CommandCenter() {
  const { db } = useDatabase();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cityFilter, setCityFilter] = useState('all');
  const [inspectedOutlet, setInspectedOutlet] = useState(null);

  const outlets = db.getOutlets();
  const tickets = db.getTickets();

  // Deep-link: auto-open inspector on mount
  useEffect(() => {
    const s = searchParams.get('search') || '';
    if (s) {
      setSearch(s);
      if (s.toUpperCase().startsWith('OUT-')) {
        const o = outlets.find(o => o.id.toUpperCase() === s.toUpperCase());
        if (o) setInspectedOutlet(o);
      }
    }
  }, []);

  const filteredOutlets = outlets.filter(o => {
    let cityMatch = false;
    if (cityFilter === 'all') cityMatch = true;
    else if (cityFilter === 'others') cityMatch = !MAIN_CITIES.map(c => c.toLowerCase()).includes(o.city.toLowerCase());
    else cityMatch = o.city.toLowerCase() === cityFilter.toLowerCase();
    const q = search.toLowerCase().trim();
    const queryMatch = !q || o.id.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || o.manager.toLowerCase().includes(q) || o.city.toLowerCase().includes(q);
    return cityMatch && queryMatch;
  });

  const criticsCount = outlets.filter(o => o.alertStatus === 'critical').length;
  const warnCount = outlets.filter(o => o.alertStatus === 'warning').length;
  let overallBadge = { cls: 'badge-success', text: `All ${outlets.length} Outlets Normal & Compliant` };
  if (criticsCount > 0) overallBadge = { cls: 'badge-danger', text: `${criticsCount} Critical Alert Outlets Active` };
  else if (warnCount > 0) overallBadge = { cls: 'badge-warning', text: `${warnCount} Outlets with Warning flags` };

  const hygieneClass = (score) => score < 70 ? 'badge-danger' : score < 80 ? 'badge-warning' : 'badge-success';
  const riskBadge = (status) => status === 'critical' ? <span className="badge badge-danger">Critical</span> : status === 'warning' ? <span className="badge badge-warning">Warning</span> : <span className="badge badge-success">Normal</span>;

  const outletTickets = inspectedOutlet ? tickets.filter(t => t.outletId === inspectedOutlet.id && t.status !== 'Resolved') : [];

  return (
    <>
      <TopHeader title="Command Center — Franchise Network" />
      <section className="content-body">
        {/* Filter Bar */}
        <div className="filter-bar" style={{ marginBottom: '20px' }}>
          <div className="search-box">
            <input
              type="text"
              className="form-control"
              placeholder="Search by outlet ID, name, manager, or city..."
              value={search}
              onChange={e => { setSearch(e.target.value); }}
            />
          </div>
          <div className="ticket-filters" style={{ flexShrink: 0 }}>
            {CITY_FILTERS.map(f => (
              <button key={f.value} className={`ticket-btn-filter ${cityFilter === f.value ? 'active' : ''}`} onClick={() => setCityFilter(f.value)}>{f.label}</button>
            ))}
          </div>
        </div>

        <TiltCard className="dashboard-card" maxTilt={1.2} style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3><i className="fa-solid fa-network-wired highlight-orange"></i> Live Franchise Operations View</h3>
            <span className={`badge ${overallBadge.cls}`}>{overallBadge.text}</span>
          </div>
          <div className="table-container" style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Outlet ID</th><th>Name</th><th>City</th><th>Manager</th>
                  <th>Revenue</th><th>Orders</th><th>Hygiene</th>
                  <th>Complaints</th><th>Wastage</th><th>Risk</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutlets.length === 0 ? (
                  <tr><td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    <i className="fa-solid fa-store-slash" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
                    No outlets match the selected search or filter criteria.
                  </td></tr>
                ) : filteredOutlets.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.id}</strong></td>
                    <td>{o.name}</td>
                    <td>{o.city}</td>
                    <td>{o.manager}</td>
                    <td>₹{o.sales.toLocaleString('en-IN')}</td>
                    <td>{o.orders}</td>
                    <td><span className={`badge ${hygieneClass(o.hygieneScore)}`}>{o.hygieneScore}%</span></td>
                    <td><span className={`badge ${o.openComplaints >= 4 ? 'badge-danger' : o.openComplaints > 0 ? 'badge-warning' : 'badge-success'}`}>{o.openComplaints}</span></td>
                    <td>{o.wastageKg.toFixed(1)} kg</td>
                    <td>{riskBadge(o.alertStatus)}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setInspectedOutlet(o)}>
                        Inspect <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TiltCard>
      </section>

      {/* Inspector Overlay */}
      {inspectedOutlet && (
        <>
          <div className="overlay-overlay show" onClick={() => setInspectedOutlet(null)}></div>
          <div className="outlet-inspector-overlay open" style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '380px', background: 'var(--bg-darker)', borderLeft: '1px solid var(--border-glass)', zIndex: 200, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{inspectedOutlet.id}</div>
                <h3 style={{ fontSize: '18px' }}>{inspectedOutlet.name}</h3>
                <span className={`badge ${inspectedOutlet.alertStatus === 'critical' ? 'badge-danger' : inspectedOutlet.alertStatus === 'warning' ? 'badge-warning' : 'badge-success'}`} style={{ marginTop: '6px' }}>{inspectedOutlet.alertStatus.toUpperCase()}</span>
              </div>
              <button className="btn-outline-sm" onClick={() => setInspectedOutlet(null)}><i className="fa-solid fa-xmark"></i> Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Manager', value: inspectedOutlet.manager },
                { label: 'City', value: inspectedOutlet.city },
                { label: 'Revenue', value: `₹${inspectedOutlet.sales.toLocaleString('en-IN')}` },
                { label: 'Orders', value: inspectedOutlet.orders },
                { label: 'Hygiene Score', value: `${inspectedOutlet.hygieneScore}%` },
                { label: 'Food Wastage', value: `${inspectedOutlet.wastageKg.toFixed(1)} kg` },
                { label: 'Open Complaints', value: inspectedOutlet.openComplaints },
              ].map(row => (
                <TiltCard key={row.label} maxTilt={8} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>{row.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{row.value}</div>
                </TiltCard>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>ACTIVE TICKETS</div>
              {outletTickets.length === 0 ? (
                <div style={{ fontSize: '11px', textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-face-smile text-green"></i> No active complaint tickets for this branch.
                </div>
              ) : outletTickets.map(t => (
                <div key={t.id} className="ai-alert-item warning" style={{ padding: '10px', cursor: 'pointer', marginBottom: '8px' }} onClick={() => navigate(`/crm?search=${t.id}`)}>
                  <div className="alert-body">
                    <h4 style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span><strong>{t.id}</strong> [{t.category}]</span>
                      <span style={{ color: 'var(--danger)' }}>{t.priority}</span>
                    </h4>
                    <p style={{ fontSize: '11px', marginTop: '4px' }}>{t.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              <button className="btn btn-outline" onClick={() => navigate(`/compliance?outletId=${inspectedOutlet.id}`)}>
                <i className="fa-solid fa-clipboard-check"></i> Run Hygiene Audit
              </button>
              <button className="btn btn-outline" onClick={() => navigate(`/crm?outletId=${inspectedOutlet.id}`)}>
                <i className="fa-solid fa-circle-plus"></i> Log Complaint
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
