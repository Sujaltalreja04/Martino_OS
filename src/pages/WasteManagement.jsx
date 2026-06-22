import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import TiltCard from '../components/TiltCard';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line, Radar, Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend);

/* ─── Waste Trend Mock Data (daily for past 7 days) ─── */
const WASTE_TREND_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WASTE_TREND_DATA = [112, 98, 135, 124, 146, 168, 155]; // kg per day

/* ─── Per-outlet daily customer footfall mock ─── */
const FOOTFALL_MOCK = {
  'OUT-01': { Mon: 140, Tue: 125, Wed: 165, Thu: 180, Fri: 220, Sat: 260, Sun: 245 },
  'OUT-02': { Mon: 180, Tue: 170, Wed: 200, Thu: 215, Fri: 280, Sat: 310, Sun: 290 },
  'OUT-03': { Mon: 100, Tue: 95, Wed: 120, Thu: 130, Fri: 175, Sat: 200, Sun: 185 },
  'OUT-04': { Mon: 75, Tue: 68, Wed: 90, Thu: 85, Fri: 130, Sat: 155, Sun: 140 },
  'OUT-05': { Mon: 90, Tue: 82, Wed: 110, Thu: 105, Fri: 160, Sat: 185, Sun: 170 },
};

export default function WasteManagement() {
  const { db } = useDatabase();
  const navigate = useNavigate();
  const [outletFilter, setOutletFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');

  const outlets = db.getOutlets();
  const rawMaterials = db.getRawMaterials();
  const inventory = db.getInventory();
  const skus = db.getSkus();

  /* ─── KPI Calculations ─── */
  const kpis = useMemo(() => {
    const filteredOutlets = outletFilter === 'all' ? outlets : outlets.filter(o => o.city === outletFilter);
    const totalWaste = filteredOutlets.reduce((s, o) => s + o.wastageKg, 0);
    const avgWaste = filteredOutlets.length > 0 ? totalWaste / filteredOutlets.length : 0;
    const understockItems = rawMaterials.filter(r => r.status === 'Understock');
    const overstockItems = rawMaterials.filter(r => r.status === 'Overstock');
    const understockValue = understockItems.reduce((s, r) => s + (r.parLevelKg - r.stockKg) * r.unitCost, 0);
    const overstockValue = overstockItems.reduce((s, r) => s + (r.stockKg - r.parLevelKg) * r.unitCost, 0);
    const lowFootfallOutlets = filteredOutlets.filter(o => o.orders < 120);
    return { totalWaste, avgWaste, understockItems, overstockItems, understockValue, overstockValue, lowFootfallOutlets, filteredOutlets };
  }, [outlets, rawMaterials, outletFilter]);

  /* ─── Unique Cities ─── */
  const cities = useMemo(() => [...new Set(outlets.map(o => o.city))].sort(), [outlets]);

  /* ─── Chart: Wastage by Outlet (Top 15 worst) ─── */
  const wastageBarData = useMemo(() => {
    const sorted = [...kpis.filteredOutlets].sort((a, b) => b.wastageKg - a.wastageKg).slice(0, 15);
    return {
      labels: sorted.map(o => o.name.length > 16 ? o.name.slice(0, 14) + '…' : o.name),
      datasets: [{
        label: 'Wastage (kg)',
        data: sorted.map(o => o.wastageKg),
        backgroundColor: sorted.map(o => o.wastageKg > 20 ? 'rgba(217, 4, 41, 0.7)' : o.wastageKg > 15 ? 'rgba(255, 183, 3, 0.7)' : 'rgba(56, 176, 0, 0.7)'),
        borderRadius: 6,
        borderSkipped: false,
      }]
    };
  }, [kpis.filteredOutlets]);

  /* ─── Chart: Stock Status Doughnut ─── */
  const stockDoughnutData = useMemo(() => {
    const counts = { Understock: 0, Normal: 0, Overstock: 0 };
    rawMaterials.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return {
      labels: ['Understock', 'Normal', 'Overstock'],
      datasets: [{
        data: [counts.Understock, counts.Normal, counts.Overstock],
        backgroundColor: ['rgba(217, 4, 41, 0.8)', 'rgba(56, 176, 0, 0.8)', 'rgba(255, 183, 3, 0.8)'],
        borderColor: ['rgba(217, 4, 41, 1)', 'rgba(56, 176, 0, 1)', 'rgba(255, 183, 3, 1)'],
        borderWidth: 2,
        hoverOffset: 10,
      }]
    };
  }, [rawMaterials]);

  /* ─── Chart: Raw Material Radar ─── */
  const radarData = useMemo(() => {
    const filtered = materialFilter === 'all' ? rawMaterials : rawMaterials.filter(r => r.category === materialFilter);
    return {
      labels: filtered.map(r => r.name.length > 14 ? r.name.slice(0, 12) + '…' : r.name),
      datasets: [
        {
          label: 'Current Stock (kg)',
          data: filtered.map(r => r.stockKg),
          backgroundColor: 'rgba(0, 180, 216, 0.15)',
          borderColor: 'rgba(0, 180, 216, 0.8)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(0, 180, 216, 1)',
          pointRadius: 4,
        },
        {
          label: 'Par Level (kg)',
          data: filtered.map(r => r.parLevelKg),
          backgroundColor: 'rgba(255, 107, 53, 0.10)',
          borderColor: 'rgba(255, 107, 53, 0.7)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 107, 53, 1)',
          pointRadius: 4,
        }
      ]
    };
  }, [rawMaterials, materialFilter]);

  /* ─── Chart: Wastage Trend Line ─── */
  const wasteTrendData = useMemo(() => ({
    labels: WASTE_TREND_LABELS,
    datasets: [{
      label: 'Daily Wastage (kg)',
      data: WASTE_TREND_DATA,
      fill: true,
      backgroundColor: 'rgba(217, 4, 41, 0.08)',
      borderColor: 'rgba(217, 4, 41, 0.8)',
      borderWidth: 3,
      tension: 0.4,
      pointBackgroundColor: 'rgba(217, 4, 41, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 8,
    }]
  }), []);

  /* ─── Chart: Outlet Performance Scatter (Orders vs Wastage) ─── */
  const scatterData = useMemo(() => ({
    datasets: [{
      label: 'Outlets',
      data: kpis.filteredOutlets.map(o => ({ x: o.orders, y: o.wastageKg, label: o.name })),
      backgroundColor: kpis.filteredOutlets.map(o => o.alertStatus === 'critical' ? 'rgba(217, 4, 41, 0.8)' : o.alertStatus === 'warning' ? 'rgba(255, 183, 3, 0.8)' : 'rgba(56, 176, 0, 0.6)'),
      pointRadius: 8,
      pointHoverRadius: 12,
    }]
  }), [kpis.filteredOutlets]);

  /* ─── Chart Options (shared dark theme) ─── */
  const darkGridOpts = {
    color: 'rgba(255,255,255,0.5)',
    grid: { color: 'rgba(255,255,255,0.06)' },
    ticks: { color: 'rgba(255,255,255,0.55)', font: { size: 11 } },
  };
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(12,14,18,0.95)', titleColor: '#fff', bodyColor: '#ccc', borderColor: 'rgba(255,107,53,0.3)', borderWidth: 1 } },
    scales: { x: { ...darkGridOpts, grid: { display: false } }, y: { ...darkGridOpts, beginAtZero: true } },
  };
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { color: '#9ea8b6', padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } }, tooltip: { backgroundColor: 'rgba(12,14,18,0.95)', titleColor: '#fff', bodyColor: '#ccc' } },
  };
  const radarOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: { r: { angleLines: { color: 'rgba(255,255,255,0.08)' }, grid: { color: 'rgba(255,255,255,0.06)' }, pointLabels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }, ticks: { display: false }, beginAtZero: true } },
    plugins: { legend: { position: 'bottom', labels: { color: '#9ea8b6', padding: 16, usePointStyle: true, font: { size: 12 } } }, tooltip: { backgroundColor: 'rgba(12,14,18,0.95)', titleColor: '#fff', bodyColor: '#ccc' } },
  };
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(12,14,18,0.95)', titleColor: '#fff', bodyColor: '#ccc', borderColor: 'rgba(217,4,41,0.3)', borderWidth: 1 } },
    scales: { x: { ...darkGridOpts, grid: { display: false } }, y: { ...darkGridOpts, beginAtZero: true } },
  };
  const scatterOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(12,14,18,0.95)', titleColor: '#fff', bodyColor: '#ccc',
        callbacks: { label: (ctx) => { const pt = kpis.filteredOutlets[ctx.dataIndex]; return pt ? `${pt.name}: ${pt.orders} orders, ${pt.wastageKg}kg waste` : ''; } }
      }
    },
    scales: {
      x: { ...darkGridOpts, title: { display: true, text: 'Orders', color: 'rgba(255,255,255,0.5)', font: { size: 12 } } },
      y: { ...darkGridOpts, title: { display: true, text: 'Wastage (kg)', color: 'rgba(255,255,255,0.5)', font: { size: 12 } }, beginAtZero: true },
    },
  };

  /* ─── Material Categories ─── */
  const materialCategories = useMemo(() => [...new Set(rawMaterials.map(r => r.category))].sort(), [rawMaterials]);

  /* ─── Inventory Alerts (stock vs demand) ─── */
  const inventoryAlerts = useMemo(() => {
    return inventory.map(item => {
      const sku = skus.find(s => s.id === item.skuId);
      const outlet = outlets.find(o => o.id === item.outletId);
      const diff = item.stock - item.demand;
      let status = 'Balanced';
      if (diff < -10) status = 'Critical Understock';
      else if (diff < 0) status = 'Understock';
      else if (diff > 50) status = 'Heavy Overstock';
      else if (diff > 10) status = 'Overstock';
      return { ...item, skuName: sku?.name || item.skuId, outletName: outlet?.name || item.outletId, diff, status };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [inventory, skus, outlets]);

  return (
    <>
      <TopHeader title="Waste Management Intelligence" />
      <section className="content-body">
        {/* ─── Filter Bar ─── */}
        <div className="wm-filter-bar animate-fade-in-up">
          <div className="wm-filter-group">
            <label><i className="fa-solid fa-location-dot"></i> City Filter</label>
            <select className="form-control" value={outletFilter} onChange={e => setOutletFilter(e.target.value)}>
              <option value="all">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="wm-filter-group">
            <label><i className="fa-solid fa-layer-group"></i> Material Category</label>
            <select className="form-control" value={materialFilter} onChange={e => setMaterialFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {materialCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="wm-filter-summary">
            <span className="badge badge-info">{kpis.filteredOutlets.length} Outlets</span>
            <span className="badge badge-warning">{rawMaterials.length} Materials Tracked</span>
          </div>
        </div>

        {/* ─── KPI Row ─── */}
        <div className="wm-kpi-grid animate-fade-in-up anim-delay-1">
          <TiltCard className="wm-kpi-card wm-kpi-waste" maxTilt={6}>
            <div className="wm-kpi-icon"><i className="fa-solid fa-trash-can"></i></div>
            <div className="wm-kpi-body">
              <span className="wm-kpi-label">Total Wastage</span>
              <span className="wm-kpi-value">{kpis.totalWaste.toFixed(1)} kg</span>
              <span className="wm-kpi-sub">Avg {kpis.avgWaste.toFixed(1)} kg/outlet</span>
            </div>
          </TiltCard>
          <TiltCard className="wm-kpi-card wm-kpi-understock" maxTilt={6}>
            <div className="wm-kpi-icon"><i className="fa-solid fa-arrow-down"></i></div>
            <div className="wm-kpi-body">
              <span className="wm-kpi-label">Understock Items</span>
              <span className="wm-kpi-value">{kpis.understockItems.length}</span>
              <span className="wm-kpi-sub">₹{kpis.understockValue.toLocaleString('en-IN')} deficit value</span>
            </div>
          </TiltCard>
          <TiltCard className="wm-kpi-card wm-kpi-overstock" maxTilt={6}>
            <div className="wm-kpi-icon"><i className="fa-solid fa-arrow-up"></i></div>
            <div className="wm-kpi-body">
              <span className="wm-kpi-label">Overstock Items</span>
              <span className="wm-kpi-value">{kpis.overstockItems.length}</span>
              <span className="wm-kpi-sub">₹{kpis.overstockValue.toLocaleString('en-IN')} excess value</span>
            </div>
          </TiltCard>
          <TiltCard className="wm-kpi-card wm-kpi-footfall" maxTilt={6}>
            <div className="wm-kpi-icon"><i className="fa-solid fa-users-slash"></i></div>
            <div className="wm-kpi-body">
              <span className="wm-kpi-label">Low Footfall Outlets</span>
              <span className="wm-kpi-value">{kpis.lowFootfallOutlets.length}</span>
              <span className="wm-kpi-sub">&lt;120 orders today</span>
            </div>
          </TiltCard>
        </div>

        {/* ─── Row 1: Wastage Bar + Stock Doughnut ─── */}
        <div className="wm-charts-row animate-fade-in-up anim-delay-2">
          <TiltCard className="dashboard-card wm-chart-wide" maxTilt={3}>
            <div className="card-header">
              <h3><i className="fa-solid fa-chart-bar text-orange"></i> Wastage by Outlet (Top 15)</h3>
              <span className="badge badge-danger">{kpis.filteredOutlets.filter(o => o.wastageKg > 20).length} Critical</span>
            </div>
            <div className="wm-chart-container" style={{ height: '320px' }}>
              <Bar data={wastageBarData} options={barOpts} />
            </div>
          </TiltCard>
          <TiltCard className="dashboard-card wm-chart-narrow" maxTilt={3}>
            <div className="card-header">
              <h3><i className="fa-solid fa-chart-pie text-orange"></i> Stock Status</h3>
            </div>
            <div className="wm-chart-container" style={{ height: '280px' }}>
              <Doughnut data={stockDoughnutData} options={doughnutOpts} />
            </div>
          </TiltCard>
        </div>

        {/* ─── Row 2: Radar + Line Trend ─── */}
        <div className="wm-charts-row animate-fade-in-up anim-delay-3">
          <TiltCard className="dashboard-card wm-chart-half" maxTilt={3}>
            <div className="card-header">
              <h3><i className="fa-solid fa-diagram-project text-orange"></i> Stock vs Par Level</h3>
              <span className="badge badge-info">Radar View</span>
            </div>
            <div className="wm-chart-container" style={{ height: '320px' }}>
              <Radar data={radarData} options={radarOpts} />
            </div>
          </TiltCard>
          <TiltCard className="dashboard-card wm-chart-half" maxTilt={3}>
            <div className="card-header">
              <h3><i className="fa-solid fa-chart-line text-orange"></i> Weekly Wastage Trend</h3>
              <span className="badge badge-danger">This Week</span>
            </div>
            <div className="wm-chart-container" style={{ height: '320px' }}>
              <Line data={wasteTrendData} options={lineOpts} />
            </div>
          </TiltCard>
        </div>

        {/* ─── Row 3: Scatter Plot (Orders vs Waste) ─── */}
        <TiltCard className="dashboard-card animate-fade-in-up anim-delay-4" maxTilt={3}>
          <div className="card-header">
            <h3><i className="fa-solid fa-braille text-orange"></i> Outlet Performance Map (Orders vs Wastage)</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(56,176,0,0.7)', display: 'inline-block' }}></span> Normal</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,183,3,0.8)', display: 'inline-block' }}></span> Warning</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(217,4,41,0.8)', display: 'inline-block' }}></span> Critical</span>
            </div>
          </div>
          <div className="wm-chart-container" style={{ height: '360px' }}>
            <Scatter data={scatterData} options={scatterOpts} />
          </div>
        </TiltCard>

        {/* ─── Row 4: Customer Footfall Heatmap ─── */}
        <TiltCard className="dashboard-card animate-fade-in-up anim-delay-1" maxTilt={3}>
          <div className="card-header">
            <h3><i className="fa-solid fa-fire text-orange"></i> Customer Footfall Heatmap</h3>
            <span className="badge badge-info">Weekly Pattern</span>
          </div>
          <div className="wm-heatmap-container">
            <div className="wm-heatmap-grid">
              <div className="wm-heatmap-corner"></div>
              {WASTE_TREND_LABELS.map(d => <div key={d} className="wm-heatmap-day-header">{d}</div>)}
              {Object.entries(FOOTFALL_MOCK).map(([outletId, days]) => {
                const outlet = outlets.find(o => o.id === outletId);
                const maxVal = Math.max(...Object.values(days));
                return (
                  <div key={outletId} className="wm-heatmap-row">
                    <div className="wm-heatmap-outlet-label">{outlet?.name || outletId}</div>
                    {WASTE_TREND_LABELS.map(day => {
                      const val = days[day] || 0;
                      const intensity = val / 320; // normalize
                      const hue = intensity > 0.7 ? 120 : intensity > 0.4 ? 50 : 0; // green > yellow > red
                      const sat = 70;
                      const light = 25 + intensity * 30;
                      return (
                        <div
                          key={day}
                          className="wm-heatmap-cell"
                          style={{ background: `hsla(${hue}, ${sat}%, ${light}%, 0.8)` }}
                          title={`${outlet?.name}: ${val} customers on ${day}`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="wm-heatmap-legend">
              <span>Low Footfall</span>
              <div className="wm-heatmap-gradient"></div>
              <span>High Footfall</span>
            </div>
          </div>
        </TiltCard>

        {/* ─── Row 5: Understock/Overstock Raw Materials Table ─── */}
        <TiltCard className="dashboard-card animate-fade-in-up anim-delay-2" maxTilt={3}>
          <div className="card-header">
            <h3><i className="fa-solid fa-boxes-stacked text-orange"></i> Raw Material Stock Alerts</h3>
            <span className="badge badge-warning">{rawMaterials.filter(r => r.status !== 'Normal').length} Alerts</span>
          </div>
          <div className="table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Par Level</th>
                  <th>Variance</th>
                  <th>Unit Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rawMaterials.map(r => {
                  const variance = r.stockKg - r.parLevelKg;
                  const variancePct = r.parLevelKg > 0 ? ((variance / r.parLevelKg) * 100).toFixed(1) : 0;
                  return (
                    <tr key={r.id}>
                      <td><strong>{r.name}</strong></td>
                      <td><span className="badge badge-info">{r.category}</span></td>
                      <td>{r.stockKg} kg</td>
                      <td>{r.parLevelKg} kg</td>
                      <td>
                        <span className={`wm-variance ${variance < 0 ? 'negative' : variance > 0 ? 'positive' : ''}`}>
                          {variance > 0 ? '+' : ''}{variance} kg ({variancePct}%)
                        </span>
                      </td>
                      <td>₹{r.unitCost}/kg</td>
                      <td>
                        <span className={`badge ${r.status === 'Understock' ? 'badge-danger' : r.status === 'Overstock' ? 'badge-warning' : 'badge-success'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TiltCard>

        {/* ─── Row 6: SKU Inventory Demand vs Stock Table ─── */}
        <TiltCard className="dashboard-card animate-fade-in-up anim-delay-3" maxTilt={3}>
          <div className="card-header">
            <h3><i className="fa-solid fa-scale-unbalanced text-orange"></i> SKU Inventory: Demand vs Stock</h3>
            <span className="badge badge-danger">{inventoryAlerts.filter(a => a.status.includes('Critical')).length} Critical</span>
          </div>
          <div className="table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Outlet</th>
                  <th>Stock</th>
                  <th>Demand</th>
                  <th>Gap</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inventoryAlerts.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.skuName}</strong></td>
                    <td>{item.outletName}</td>
                    <td>{item.stock}</td>
                    <td>{item.demand}</td>
                    <td>
                      <span className={`wm-variance ${item.diff < 0 ? 'negative' : item.diff > 10 ? 'positive' : ''}`}>
                        {item.diff > 0 ? '+' : ''}{item.diff}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.status.includes('Critical') ? 'badge-danger' : item.status.includes('Understock') ? 'badge-danger' : item.status.includes('Overstock') ? 'badge-warning' : 'badge-success'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.diff < -10 && (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/logistics-kds')}>
                          <i className="fa-solid fa-truck-fast"></i> Reorder
                        </button>
                      )}
                      {item.diff > 50 && (
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/forecasting')}>
                          <i className="fa-solid fa-brain"></i> Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TiltCard>

        {/* ─── AI Waste Reduction Insights ─── */}
        <TiltCard className="dashboard-card wm-ai-insights animate-fade-in-up anim-delay-4" maxTilt={3}>
          <div className="card-header">
            <h3><i className="fa-solid fa-wand-magic-sparkles text-orange"></i> AI Waste Reduction Insights</h3>
            <span className="badge badge-info">Auto-generated</span>
          </div>
          <div className="wm-insights-grid">
            {kpis.filteredOutlets.filter(o => o.wastageKg > 20).map(o => (
              <div key={o.id} className="wm-insight-card critical">
                <div className="wm-insight-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
                <div className="wm-insight-body">
                  <h4>{o.name} — Excessive Waste</h4>
                  <p>Wastage at {o.wastageKg}kg (limit: 20kg). AI recommends reducing prep volume by {Math.round((o.wastageKg - 15) / o.wastageKg * 100)}% and adjusting inventory order for next cycle.</p>
                </div>
              </div>
            ))}
            {kpis.understockItems.map(r => (
              <div key={r.id} className="wm-insight-card warning">
                <div className="wm-insight-icon"><i className="fa-solid fa-box-open"></i></div>
                <div className="wm-insight-body">
                  <h4>{r.name} — Low Stock Alert</h4>
                  <p>Only {r.stockKg}kg remaining vs {r.parLevelKg}kg par level. Estimated stockout in {Math.max(1, Math.floor(r.stockKg / (r.parLevelKg / 7)))} days. Auto-reorder recommended.</p>
                </div>
              </div>
            ))}
            {kpis.lowFootfallOutlets.length > 0 && (
              <div className="wm-insight-card info">
                <div className="wm-insight-icon"><i className="fa-solid fa-store-slash"></i></div>
                <div className="wm-insight-body">
                  <h4>{kpis.lowFootfallOutlets.length} Outlets with Low Customer Traffic</h4>
                  <p>Outlets: {kpis.lowFootfallOutlets.slice(0, 5).map(o => o.name).join(', ')}. Consider running targeted promotions or adjusting operating hours to reduce idle waste.</p>
                </div>
              </div>
            )}
            <div className="wm-insight-card info">
              <div className="wm-insight-icon"><i className="fa-solid fa-lightbulb"></i></div>
              <div className="wm-insight-body">
                <h4>Weekend Prep Optimization</h4>
                <p>Historical data shows 35% increase in weekend demand. Pre-positioning extra inventory at high-traffic outlets (Ahmedabad, Surat) can reduce Sunday stockout events by up to 40%.</p>
              </div>
            </div>
          </div>
        </TiltCard>
      </section>
    </>
  );
}
