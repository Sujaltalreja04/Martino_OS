import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import TiltCard from '../components/TiltCard';

const CHECKLIST_ITEMS = [
  { id: 'cl1', weight: 25, label: 'Cold Storage Temp Logs', desc: 'Refrigerators and cold storage units maintained below 5°C. Hourly digital log sheets reviewed and countersigned.', category: 'Food Safety & Storage' },
  { id: 'cl2', weight: 20, label: 'Ingredient Expiry & Batch Dating', desc: 'All opened ingredients are labelled with batch dates. Expired dough, cheese or sauce found discarded.', category: 'Food Safety & Storage' },
  { id: 'cl3', weight: 15, label: 'Raw Ingredient Segregation', desc: 'Separate cutting boards, containers, and utensils for veg and non-veg ingredients maintained throughout the shift.', category: 'Food Safety & Storage' },
  { id: 'cl4', weight: 25, label: 'Line & Oven Sanitation Shift Schedule', desc: 'Pizza prep counter, oven walls, and conveyor cleaned between breakfast and dinner service using approved chemicals.', category: 'Kitchen Hygiene' },
  { id: 'cl5', weight: 15, label: 'Staff Hygiene — Handwash Compliance', desc: 'Food handlers washing hands every 30 mins and after touching any non-food surface verified through logbook review.', category: 'Kitchen Hygiene' },
  { id: 'cl6', weight: 10, label: 'FSSAI Compliant License Display', desc: 'Valid FSSAI Annual License Certificate displayed prominently at entry with current year endorsement visible to customers.', category: 'Compliance Documentation' },
];

export default function Compliance() {
  const { db, refresh } = useDatabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outlets = db.getOutlets();

  const [selectedOutletId, setSelectedOutletId] = useState(() => searchParams.get('outletId') || (outlets[0]?.id || ''));
  const [checked, setChecked] = useState({});

  const outlet = outlets.find(o => o.id === selectedOutletId);

  // Load checklist state based on outlet's current score
  useEffect(() => {
    if (!outlet) return;
    const score = outlet.hygieneScore;
    const newChecked = {};
    CHECKLIST_ITEMS.forEach(item => {
      if (score >= 95) newChecked[item.id] = true;
      else if (score >= 85) newChecked[item.id] = item.weight > 10;
      else if (score >= 75) newChecked[item.id] = item.weight !== 20;
      else newChecked[item.id] = item.weight === 25 || item.weight === 15 || item.weight === 10;
    });
    setChecked(newChecked);
  }, [selectedOutletId]);

  const totalScore = CHECKLIST_ITEMS.reduce((sum, item) => sum + (checked[item.id] ? item.weight : 0), 0);
  const gaugeStatus = totalScore >= 85 ? { text: 'Compliant Rating', cls: 'badge-success', color: 'var(--success)' }
    : totalScore >= 70 ? { text: 'Warning Flag', cls: 'badge-warning', color: 'var(--warning)' }
    : { text: 'Critical FSSAI Risk', cls: 'badge-danger', color: 'var(--danger)' };

  const categories = [...new Set(CHECKLIST_ITEMS.map(i => i.category))];

  const handleSubmit = (e) => {
    e.preventDefault();
    db.submitHygieneAudit(selectedOutletId, totalScore);
    refresh();
    alert(`HQ Compliance Registry: Audit submitted successfully!\n\nOutlet: ${selectedOutletId}\nHygiene Compliance Score: ${totalScore}%`);
    navigate(`/command-center?search=${selectedOutletId}`);
  };

  return (
    <>
      <TopHeader title="Hygiene Audit & Compliance" />
      <section className="content-body">
        <div className="compliance-layout">
          {/* Left: Checklist */}
          <form onSubmit={handleSubmit}>
            <TiltCard className="dashboard-card" maxTilt={2}>
              <div className="card-header">
                <h3><i className="fa-solid fa-shield-halved highlight-orange"></i> Compliance Audit Checklist</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select className="form-control" style={{ width: '280px' }} value={selectedOutletId} onChange={e => setSelectedOutletId(e.target.value)}>
                    {outlets.map(o => <option key={o.id} value={o.id}>{o.name} ({o.city}) — Score: {o.hygieneScore}%</option>)}
                  </select>
                </div>
              </div>

              {categories.map(cat => (
                <div key={cat} style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '12px', letterSpacing: '0.05em' }}>
                    <i className="fa-solid fa-circle-chevron-right text-orange"></i> {cat}
                  </h4>
                  {CHECKLIST_ITEMS.filter(item => item.category === cat).map(item => (
                    <div key={item.id} className="ai-alert-item info" style={{ marginBottom: '12px', cursor: 'pointer', padding: '14px 16px' }} onClick={() => setChecked(c => ({ ...c, [item.id]: !c[item.id] }))}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', width: '100%' }}>
                        <input
                           type="checkbox"
                           checked={!!checked[item.id]}
                           onChange={() => setChecked(c => ({ ...c, [item.id]: !c[item.id] }))}
                           onClick={e => e.stopPropagation()}
                           style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }}
                        />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px' }}>{item.label}</strong>
                            <span className="badge badge-info">{item.weight} pts</span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                <i className="fa-solid fa-paper-plane"></i> Submit HQ Compliance Audit Report
              </button>
            </TiltCard>
          </form>

          {/* Right: Gauge */}
          <div>
            <TiltCard className="dashboard-card" maxTilt={3} style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
              <div className="card-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0, marginBottom: '24px' }}>
                <h3><i className="fa-solid fa-circle-half-stroke highlight-orange"></i> Real-time Compliance Score</h3>
              </div>
              <div style={{
                width: '160px', height: '160px', borderRadius: '50%',
                border: `6px solid ${gaugeStatus.color}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', background: 'rgba(0,0,0,0.2)',
                transition: 'border-color 0.5s ease'
              }}>
                <span style={{ fontSize: '40px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: gaugeStatus.color }}>{totalScore}%</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>SCORE</span>
              </div>
              <span className={`badge ${gaugeStatus.cls}`} style={{ fontSize: '12px', padding: '6px 16px' }}>{gaugeStatus.text}</span>

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {CHECKLIST_ITEMS.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '8px 0', borderBottom: '1px solid var(--border-glass)' }}>
                    <span style={{ color: checked[item.id] ? 'var(--text-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className={`fa-solid ${checked[item.id] ? 'fa-circle-check text-green' : 'fa-circle-xmark text-danger-red'}`}></i>
                      {item.label}
                    </span>
                    <span style={{ fontWeight: 700, color: checked[item.id] ? gaugeStatus.color : 'var(--text-muted)' }}>+{item.weight}</span>
                  </div>
                ))}
              </div>
            </TiltCard>
          </div>
        </div>
      </section>
    </>
  );
}
