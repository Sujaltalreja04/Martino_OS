import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import TiltCard from '../components/TiltCard';
import ThreeDPizza from '../components/ThreeDPizza';

export default function Dashboard() {
  const { db } = useDatabase();
  const navigate = useNavigate();
  const [leaderboardMode, setLeaderboardMode] = useState('top');

  const stats = db.getGlobalStats();
  const outlets = db.getOutlets();
  const tickets = db.getTickets();

  const revenueTarget = 200000;
  const ordersTarget = 8000;
  const complaintsThreshold = 10;
  const revenuePct = Math.min((stats.totalRevenue / revenueTarget) * 100, 100);
  const ordersPct = Math.min((stats.totalOrders / ordersTarget) * 100, 100);
  const hygienePct = stats.avgHygieneScore;
  const complaintsPct = Math.min((stats.openComplaints / complaintsThreshold) * 100, 100);

  // Leaderboard
  const outletsWithScores = outlets.map(o => ({
    ...o,
    perfScore: (o.sales / 100) + o.hygieneScore - (o.openComplaints * 5)
  }));
  const sorted = [...outletsWithScores].sort((a, b) =>
    leaderboardMode === 'top' ? b.perfScore - a.perfScore : a.perfScore - b.perfScore
  );
  const leaderboardItems = sorted.slice(0, 5);

  // Risk outlets
  const riskOutlets = outlets.filter(o => o.alertStatus === 'warning' || o.alertStatus === 'critical');

  // AI Insights
  const insights = [];
  const criticalTickets = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved');
  criticalTickets.forEach(t => insights.push({
    type: 'critical',
    title: `Food Safety Incident Breached in ${t.outletName}`,
    desc: `Ticket ${t.id} (${t.category}): "${t.description}" is active. Urgent action required to prevent FSSAI audit penalties.`
  }));
  outlets.forEach(o => {
    if (o.hygieneScore < 75) insights.push({ type: 'warning', title: `Hygiene Score Alert: ${o.name}`, desc: `Cleanliness score has dropped to ${o.hygieneScore}%. Daily checklists are missing photo audit confirmations for cooking lines.` });
  });
  outlets.forEach(o => {
    if (o.wastageKg > 20) insights.push({ type: 'info', title: `Excess Food Waste: ${o.name}`, desc: `Wastage exceeded limit at ${o.wastageKg}kg. System suggests decreasing prep count for garlic bread dough by 15% tomorrow.` });
  });
  insights.push({ type: 'info', title: 'Weekend Demand Forecast Peak', desc: 'High temperature (+36°C) and upcoming Sunday holiday predicted to increase beverage demands by 22.4% across Surat branches.' });
  const displayedInsights = insights.slice(0, 4);

  const insightIconMap = { critical: 'fa-triangle-exclamation', warning: 'fa-circle-exclamation', info: 'fa-circle-info' };

  return (
    <>
      <TopHeader title="Executive Dashboard" />
      <section className="content-body">
        {/* Stats Row */}
        <div className="grid-stats">
          <TiltCard className="stat-card" maxTilt={8}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p>Total Revenue (Today)</p>
              <div className="stat-value revenue-val">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
              <div className="stat-progress"><div className="stat-progress-bar revenue" style={{ width: `${revenuePct}%` }}></div></div>
              <div className="stat-trend trend-up"><i className="fa-solid fa-arrow-trend-up"></i> +14.2% vs Last Week</div>
            </div>
            <div className="stat-icon"><i className="fa-solid fa-indian-rupee-sign"></i></div>
          </TiltCard>
          <TiltCard className="stat-card" maxTilt={8}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p>Total Orders (Today)</p>
              <div className="stat-value orders-val">{stats.totalOrders.toLocaleString('en-IN')}</div>
              <div className="stat-progress"><div className="stat-progress-bar orders" style={{ width: `${ordersPct}%` }}></div></div>
              <div className="stat-trend trend-up"><i className="fa-solid fa-arrow-trend-up"></i> +8.7% vs Last Week</div>
            </div>
            <div className="stat-icon"><i className="fa-solid fa-basket-shopping"></i></div>
          </TiltCard>
          <TiltCard className="stat-card" maxTilt={8}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p>Avg Hygiene Score</p>
              <div className="stat-value hygiene-val">{stats.avgHygieneScore.toFixed(1)}%</div>
              <div className="stat-progress"><div className="stat-progress-bar hygiene" style={{ width: `${hygienePct}%` }}></div></div>
              <div className={`stat-trend ${stats.avgHygieneScore >= 85 ? 'trend-up' : 'trend-down'}`}>
                {stats.avgHygieneScore >= 85
                  ? <><i className="fa-solid fa-circle-check"></i> Standard Compliant</>
                  : <><i className="fa-solid fa-triangle-exclamation"></i> Action Required</>}
              </div>
            </div>
            <div className="stat-icon"><i className="fa-solid fa-hand-holding-hand"></i></div>
          </TiltCard>
          <TiltCard className="stat-card" maxTilt={8}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p>Active Complaints</p>
              <div className="stat-value complaints-val">{stats.openComplaints}</div>
              <div className="stat-progress"><div className="stat-progress-bar complaints" style={{ width: `${complaintsPct}%` }}></div></div>
              <div className={`stat-trend ${stats.openComplaints > 8 ? 'trend-down' : 'trend-up'}`}>
                {stats.openComplaints > 8
                  ? <><i className="fa-solid fa-arrow-trend-up"></i> +12% vs Last Week</>
                  : <><i className="fa-solid fa-arrow-trend-down"></i> -18.2% vs Last Week</>}
              </div>
            </div>
            <div className="stat-icon"><i className="fa-solid fa-receipt"></i></div>
          </TiltCard>
        </div>

        {/* Main Grid */}
        <div className="grid-dashboard-main">
          {/* Left Column */}
          <div className="left-col">
            {/* Interactive 3D Exploded Pizza slice showcase */}
            <ThreeDPizza />

            {/* AI Insights */}
            <TiltCard className="dashboard-card" maxTilt={4}>
              <div className="card-header">
                <h3><i className="fa-solid fa-wand-magic-sparkles text-orange"></i> AI Executive Insights</h3>
                <span className="badge badge-info">Real-time Feed</span>
              </div>
              <div className="ai-alerts-list">
                {displayedInsights.map((ins, i) => (
                  <div key={i} className={`ai-alert-item ${ins.type}`}>
                    <div className="alert-badge-icon"><i className={`fa-solid ${insightIconMap[ins.type]}`}></i></div>
                    <div className="alert-body">
                      <h4>{ins.title}</h4>
                      <p>{ins.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TiltCard>

            {/* High-Risk Outlets */}
            <TiltCard className="dashboard-card" maxTilt={3}>
              <div className="card-header">
                <h3><i className="fa-solid fa-triangle-exclamation text-orange"></i> High-Risk Outlets Checklist</h3>
                <span className="badge badge-danger">{riskOutlets.length} Outlets</span>
              </div>
              <div className="table-container">
                <table className="dashboard-table">
                  <thead><tr><th>Outlet ID</th><th>Name</th><th>City</th><th>Hygiene Score</th><th>Open Complaints</th><th>Action</th></tr></thead>
                  <tbody>
                    {riskOutlets.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        <i className="fa-solid fa-circle-check text-green"></i> No high-risk outlets detected today.
                      </td></tr>
                    ) : riskOutlets.map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.id}</strong></td>
                        <td>{o.name}</td>
                        <td>{o.city}</td>
                        <td><span className={`badge ${o.hygieneScore < 75 ? 'badge-danger' : 'badge-warning'}`}>{o.hygieneScore}%</span></td>
                        <td><span className={`badge ${o.openComplaints >= 4 ? 'badge-danger' : 'badge-warning'}`}>{o.openComplaints} Tickets</span></td>
                        <td><button className="btn btn-outline btn-sm" onClick={() => navigate(`/command-center?search=${o.id}`)}>Inspect</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TiltCard>
          </div>

          {/* Right Column */}
          <div className="right-col">
            {/* Leaderboard */}
            <TiltCard className="dashboard-card" maxTilt={4}>
              <div className="card-header">
                <h3><i className="fa-solid fa-crown text-gold"></i> Franchise Standings</h3>
                <div className="ticket-filters">
                  <button className={`ticket-btn-filter ${leaderboardMode === 'top' ? 'active' : ''}`} onClick={() => setLeaderboardMode('top')}>Top 5</button>
                  <button className={`ticket-btn-filter ${leaderboardMode === 'bottom' ? 'active' : ''}`} onClick={() => setLeaderboardMode('bottom')}>Bottom 5</button>
                </div>
              </div>
              <div className="leaderboard-list">
                {leaderboardItems.map((item, index) => {
                  const rankDisplay = leaderboardMode === 'top' ? index + 1 : outlets.length - index;
                  return (
                    <div key={item.id} className="leaderboard-item" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="rank-meta">
                        <div className={`rank-badge rank-${rankDisplay}`}>{rankDisplay}</div>
                        <div>
                          <div className="outlet-name">{item.name}</div>
                          <div className="outlet-city">{item.city}</div>
                        </div>
                      </div>
                      <div className={`rank-score ${item.hygieneScore >= 85 ? 'high' : 'low'}`}>
                        {item.hygieneScore}% <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>hygiene</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TiltCard>

            {/* Quick Actions */}
            <TiltCard className="dashboard-card" maxTilt={4}>
              <div className="card-header">
                <h3><i className="fa-solid fa-gears"></i> Core Operations Quick Actions</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-outline btn-block" onClick={() => navigate('/command-center')} style={{ justifyContent: 'flex-start' }}>
                  <i className="fa-solid fa-magnifying-glass"></i> Search Franchise Outlets
                </button>
                <button className="btn btn-outline btn-block" onClick={() => navigate('/forecasting')} style={{ justifyContent: 'flex-start' }}>
                  <i className="fa-solid fa-calculator"></i> Run AI Demand Planner
                </button>
                <button className="btn btn-outline btn-block" onClick={() => navigate('/crm')} style={{ justifyContent: 'flex-start' }}>
                  <i className="fa-solid fa-circle-plus"></i> Register Customer Complaint
                </button>
                <button className="btn btn-outline btn-block" onClick={() => navigate('/compliance')} style={{ justifyContent: 'flex-start' }}>
                  <i className="fa-solid fa-clipboard-check"></i> Fill Out Hygiene Audit Check
                </button>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>
    </>
  );
}
