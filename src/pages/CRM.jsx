import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import TiltCard from '../components/TiltCard';

const FILTER_TABS = [
  { label: 'Active', value: 'active' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'All Tickets', value: 'all' },
];

const CATEGORIES = ['Food Safety', 'Hygiene', 'Taste', 'Delivery', 'Packaging', 'Staff Behavior'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export default function CRM() {
  const { db, refresh } = useDatabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [filter, setFilter] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState({ outletId: '', category: 'Food Safety', priority: 'High', description: '' });

  const outlets = db.getOutlets();
  const tickets = db.getTickets();

  // Deep link
  useEffect(() => {
    const ticketParam = searchParams.get('search');
    const outletParam = searchParams.get('outletId');
    if (ticketParam) {
      const t = tickets.find(t => t.id === ticketParam);
      if (t) {
        setFilter(t.status === 'Resolved' ? 'Resolved' : 'active');
        setSelectedId(ticketParam);
      }
    } else if (outletParam) {
      setFormState(f => ({ ...f, outletId: outletParam }));
      setShowModal(true);
    }
    if (!formState.outletId && outlets.length > 0) {
      setFormState(f => ({ ...f, outletId: outlets[0].id }));
    }
  }, []);

  useEffect(() => {
    if (!formState.outletId && outlets.length > 0) {
      setFormState(f => ({ ...f, outletId: outlets[0].id }));
    }
  }, [outlets]);

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'Resolved') return t.status === 'Resolved';
    return t.status === 'Open' || t.status === 'Escalated';
  });

  const selectedTicket = tickets.find(t => t.id === selectedId);
  const selectedOutlet = selectedTicket ? outlets.find(o => o.id === selectedTicket.outletId) : null;

  const priorityBadge = (p) => p === 'Critical' ? 'badge-danger' : p === 'High' ? 'badge-warning' : 'badge-info';
  const statusBadge = (s) => s === 'Resolved' ? 'badge-success' : s === 'Escalated' ? 'badge-danger' : 'badge-warning';

  const handleResolve = () => {
    db.resolveTicket(selectedId);
    refresh();
  };
  const handleEscalate = () => {
    db.escalateTicket(selectedId);
    refresh();
  };
  const handleSubmitTicket = (e) => {
    e.preventDefault();
    const newTicket = db.addTicket(formState);
    refresh();
    setShowModal(false);
    setFilter('active');
    setSelectedId(newTicket.id);
    setFormState(f => ({ ...f, description: '' }));
  };

  return (
    <>
      <TopHeader title="Complaint Intelligence CRM" />
      <section className="content-body">
        <div className="crm-layout">
          {/* Left Panel - Ticket List */}
          <TiltCard className="tickets-list-wrapper" maxTilt={1.5}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3><i className="fa-solid fa-ticket highlight-orange"></i> Complaint Registry</h3>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <i className="fa-solid fa-plus"></i> Log Ticket
              </button>
            </div>
            <div className="ticket-filters">
              {FILTER_TABS.map(tab => (
                <button key={tab.value} className={`ticket-btn-filter ${filter === tab.value ? 'active' : ''}`} onClick={() => setFilter(tab.value)}>{tab.label}</button>
              ))}
            </div>
            <div className="tickets-scroller">
              {filteredTickets.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                  <i className="fa-solid fa-folder-open" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
                  <p>No tickets in this folder.</p>
                </div>
              ) : filteredTickets.map(t => (
                <div key={t.id} className={`ticket-card-item ${selectedId === t.id ? 'selected' : ''}`} onClick={() => setSelectedId(t.id)}>
                  <div className="ticket-card-header">
                    <span className="ticket-id">{t.id}</span>
                    <span className={`badge ${statusBadge(t.status)}`}>{t.status}</span>
                  </div>
                  <div className="ticket-card-body">
                    <h4>{t.outletName}</h4>
                    <p>{t.description}</p>
                  </div>
                  <div className="ticket-card-footer">
                    <span className={`badge ${priorityBadge(t.priority)}`}>{t.priority}</span>
                    {t.status === 'Resolved'
                      ? <span style={{ color: 'var(--text-muted)' }}><i className="fa-regular fa-circle-check"></i> Closed</span>
                      : <span className="sla-tag"><i className="fa-regular fa-clock"></i> SLA: {t.slaHours}h</span>}
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>

          {/* Right Panel - Ticket Detail */}
          <TiltCard maxTilt={1} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {!selectedTicket ? (
              <div className="empty-details-state" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-clipboard-question" style={{ fontSize: '40px', marginBottom: '16px', display: 'block', color: 'var(--text-muted)' }}></i>
                <h3 style={{ marginBottom: '8px' }}>No Ticket Selected</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select an active complaint ticket from the registry list to investigate description, outlet metrics, and execute resolution workflows.</p>
              </div>
            ) : (
              <>
                <div className="card-header" style={{ paddingBottom: '12px', marginBottom: '18px' }}>
                  <h3><i className="fa-solid fa-eye text-orange"></i> Inspect Ticket: {selectedTicket.id}</h3>
                  <span className={`badge ${statusBadge(selectedTicket.status)}`}>{selectedTicket.status}</span>
                </div>
                <div className="ticket-info-grid">
                  {[
                    { label: 'Outlet Name', value: `${selectedTicket.outletName} (${selectedOutlet?.city || 'N/A'})` },
                    { label: 'Branch Manager', value: selectedOutlet?.manager || 'N/A' },
                    { label: 'Category', value: selectedTicket.category },
                    { label: 'Priority Severity', value: <span className={`badge ${priorityBadge(selectedTicket.priority)}`}>{selectedTicket.priority}</span> },
                    { label: 'Date Created', value: new Date(selectedTicket.dateCreated).toLocaleString() },
                    { label: 'SLA Resolution', value: selectedTicket.status === 'Resolved' ? 'Closed' : `${selectedTicket.slaHours} hours` },
                  ].map(row => (
                    <div key={row.label} className="info-field">
                      <h5>{row.label}</h5>
                      <p>{row.value}</p>
                    </div>
                  ))}
                </div>
                <h5 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '16px 0 8px' }}>Customer Complaint Description</h5>
                <div className="ticket-desc-box">{selectedTicket.description}</div>
                <div className="overlay-grid" style={{ marginBottom: '24px' }}>
                  <TiltCard className="overlay-metric" maxTilt={6}>
                    <h5>Outlet Hygiene</h5>
                    <p>{selectedOutlet?.hygieneScore || 0}%</p>
                  </TiltCard>
                  <TiltCard className="overlay-metric" maxTilt={6}>
                    <h5>Active Complaints</h5>
                    <p>{selectedOutlet?.openComplaints || 0}</p>
                  </TiltCard>
                </div>
                {selectedTicket.status !== 'Resolved' && (
                  <div className="ticket-actions-group">
                    <button className="btn btn-outline" onClick={handleEscalate} disabled={selectedTicket.status === 'Escalated'}>
                      <i className="fa-solid fa-arrow-up-right-dots text-orange"></i> Escalate Urgency
                    </button>
                    <button className="btn btn-primary" onClick={handleResolve} style={{ background: 'var(--success)' }}>
                      <i className="fa-solid fa-check"></i> Mark Resolved
                    </button>
                  </div>
                )}
              </>
            )}
          </TiltCard>
        </div>
      </section>

      {/* Log Ticket Modal */}
      {showModal && (
        <div className="modal-overlay open" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--bg-darker)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '480px', maxWidth: '95vw' }}>
            <div className="card-header" style={{ marginBottom: '24px' }}>
              <h3><i className="fa-solid fa-circle-plus highlight-orange"></i> Log New Complaint</h3>
              <button className="btn-outline-sm" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmitTicket}>
              <div className="form-group">
                <label>Outlet</label>
                <select className="form-control" value={formState.outletId} onChange={e => setFormState(f => ({ ...f, outletId: e.target.value }))}>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name} ({o.city})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={formState.category} onChange={e => setFormState(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={formState.priority} onChange={e => setFormState(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows="4" required value={formState.description} onChange={e => setFormState(f => ({ ...f, description: e.target.value }))} placeholder="Describe the customer complaint in detail..."></textarea>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
