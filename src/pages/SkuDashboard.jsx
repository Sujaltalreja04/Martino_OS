import { useState, useRef, useEffect } from 'react';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import TiltCard from '../components/TiltCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SkuDashboard() {
  const { db, refresh } = useDatabase();
  const [mismatchType, setMismatchType] = useState('all');
  const [outletFilter, setOutletFilter] = useState('all');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('');

  const outlets = db.getOutlets();
  const inventory = db.getInventory();
  const skus = db.getSkus();
  const stats = db.getInventoryStats();
  const promos = db.getPromos();

  // Build table data
  let tableData = inventory.map(item => {
    const sku = skus.find(s => s.id === item.skuId) || { name: 'Unknown', price: 0 };
    const outlet = outlets.find(o => o.id === item.outletId) || { name: 'Unknown' };
    const diff = item.stock - item.demand;
    let type = 'aligned', financialImpact = 0;
    if (diff < 0) { type = 'stockout'; financialImpact = Math.abs(diff) * sku.price; }
    else if (diff > 0) { type = 'overstock'; financialImpact = diff * sku.price; }
    return { ...item, skuName: sku.name, skuPrice: sku.price, outletName: outlet.name, diff, type, financialImpact };
  });

  if (outletFilter !== 'all') tableData = tableData.filter(i => i.outletId === outletFilter);
  if (mismatchType !== 'all') tableData = tableData.filter(i => i.type === mismatchType);

  // Chart data (filtered by outlet only, not mismatch type)
  const chartInventory = outletFilter === 'all' ? inventory : inventory.filter(i => i.outletId === outletFilter);
  const chartOutletLabel = outletFilter === 'all' ? 'All Territories' : (outlets.find(o => o.id === outletFilter)?.name || 'Unknown');
  const skuLabels = skus.map(s => s.name);
  const stockData = skus.map(sku => chartInventory.filter(i => i.skuId === sku.id).reduce((s, i) => s + i.stock, 0));
  const demandData = skus.map(sku => chartInventory.filter(i => i.skuId === sku.id).reduce((s, i) => s + i.demand, 0));

  const chartData = {
    labels: skuLabels,
    datasets: [
      { label: 'Available Stock (Units)', data: stockData, backgroundColor: 'rgba(0, 180, 216, 0.75)', borderColor: 'rgba(0, 180, 216, 1)', borderWidth: 1, borderRadius: 4 },
      { label: 'Projected Demand (Units)', data: demandData, backgroundColor: 'rgba(255, 107, 53, 0.75)', borderColor: 'rgba(255, 107, 53, 1)', borderWidth: 1, borderRadius: 4 }
    ]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#9ea8b6', font: { family: 'Inter', size: 10 } } },
      tooltip: { backgroundColor: '#0c0e12', titleFont: { family: 'Outfit', size: 12, weight: 'bold' }, bodyFont: { family: 'Inter', size: 11 }, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#f8f9fa', font: { family: 'Inter', size: 9 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9ea8b6', font: { family: 'Inter', size: 10 } } }
    }
  };

  const handleRestock = (invId) => {
    const inv = db.getInventory();
    const record = inv.find(i => i.id === invId);
    if (record) { record.stock = record.demand; db.saveInventory(inv); refresh(); }
  };
  const handleDiscount = (invId) => {
    const inv = db.getInventory();
    const record = inv.find(i => i.id === invId);
    if (record) { record.stock = record.demand; db.saveInventory(inv); refresh(); }
  };
  const handleCreatePromo = () => {
    if (!promoCode.trim() || isNaN(parseInt(promoDiscount)) || parseInt(promoDiscount) <= 0 || parseInt(promoDiscount) > 100) {
      alert('Please enter a valid Promo Code and Discount percentage (1-100)');
      return;
    }
    db.addPromo(promoCode.toUpperCase(), parseInt(promoDiscount), `Promo: Flat ${promoDiscount}% off`);
    refresh();
    setPromoCode('');
    setPromoDiscount('');
  };

  const lostSalesPct = Math.min((stats.totalLostSales / 100000) * 100, 100);
  const wastagePct = Math.min((stats.totalWastageVal / 100000) * 100, 100);
  const alertsPct = Math.min((stats.totalAlerts / 10) * 100, 100);

  return (
    <>
      <TopHeader title="SKU Performance & Stock Alignment" />
      <section className="content-body">
        {/* Stats Row */}
        <div className="grid-stats">
          <TiltCard className="stat-card" maxTilt={8}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p>Total Lost Sales (Stockout)</p>
              <div className="stat-value complaints-val">₹{stats.totalLostSales.toLocaleString('en-IN')}</div>
              <div className="stat-progress"><div className="stat-progress-bar complaints" style={{ width: `${lostSalesPct}%` }}></div></div>
              <div className="stat-trend trend-down"><i className="fa-solid fa-triangle-exclamation"></i> Stockout threat active</div>
            </div>
            <div className="stat-icon"><i className="fa-solid fa-arrow-down-short-wide"></i></div>
          </TiltCard>
          <TiltCard className="stat-card" maxTilt={8}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p>Wastage Value Risk (Overstock)</p>
              <div className="stat-value orders-val">₹{stats.totalWastageVal.toLocaleString('en-IN')}</div>
              <div className="stat-progress"><div className="stat-progress-bar orders" style={{ width: `${wastagePct}%` }}></div></div>
              <div className="stat-trend trend-down"><i className="fa-solid fa-dumpster"></i> Spoilage risk warning</div>
            </div>
            <div className="stat-icon"><i className="fa-solid fa-scale-unbalanced"></i></div>
          </TiltCard>
          <TiltCard className="stat-card" maxTilt={8}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p>Stock Alignment Score</p>
              <div className="stat-value revenue-val">{stats.alignmentScore}%</div>
              <div className="stat-progress"><div className="stat-progress-bar revenue" style={{ width: `${stats.alignmentScore}%` }}></div></div>
              <div className="stat-trend trend-up"><i className="fa-solid fa-circle-check"></i> Standard target: 90%</div>
            </div>
            <div className="stat-icon"><i className="fa-solid fa-sliders"></i></div>
          </TiltCard>
          <TiltCard className="stat-card" maxTilt={8}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p>Mismatch Alerts</p>
              <div className="stat-value complaints-val">{stats.totalAlerts}</div>
              <div className="stat-progress"><div className="stat-progress-bar complaints" style={{ width: `${alertsPct}%` }}></div></div>
              <div className="stat-trend trend-down"><i className="fa-solid fa-bell"></i> Critical deviation alert</div>
            </div>
            <div className="stat-icon"><i className="fa-solid fa-bell-slash"></i></div>
          </TiltCard>
        </div>

        {/* Main Grid */}
        <div className="grid-sku-main">
          {/* Chart */}
          <div className="left-col">
            <TiltCard className="dashboard-card" maxTilt={2.5} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <h3><i className="fa-solid fa-chart-bar highlight-orange"></i> Stock vs Demand comparison</h3>
                <span className="badge badge-info">{chartOutletLabel}</span>
              </div>
              <div className="chart-container-sku" style={{ flexGrow: 1 }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </TiltCard>
          </div>

          {/* Right Controls */}
          <div className="right-col">
            <TiltCard className="dashboard-card" maxTilt={2} style={{ marginBottom: 0 }}>
              <div className="card-header" style={{ paddingBottom: '12px', marginBottom: '16px' }}>
                <h3><i className="fa-solid fa-triangle-exclamation text-orange"></i> Mismatch Control Center</h3>
              </div>
              <div className="sku-controls-bar">
                <select className="form-control" value={mismatchType} onChange={e => setMismatchType(e.target.value)} style={{ flexGrow: 1 }}>
                  <option value="all">All Mismatches</option>
                  <option value="stockout">Stockout Risks (Low Stock)</option>
                  <option value="overstock">Overstocks (Low Demand)</option>
                </select>
                <select className="form-control" value={outletFilter} onChange={e => setOutletFilter(e.target.value)} style={{ flexGrow: 1 }}>
                  <option value="all">All Outlets</option>
                  {outlets.sort((a, b) => a.name.localeCompare(b.name)).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                <table className="dashboard-table">
                  <thead><tr><th>Outlet</th><th>Product SKU</th><th>Stock</th><th>Demand</th><th>Financial Impact</th><th>Action</th></tr></thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        <i className="fa-solid fa-circle-check text-success-green"></i> No active stock mismatches found matching filters.
                      </td></tr>
                    ) : tableData.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.outletName}</strong></td>
                        <td>{item.skuName}</td>
                        <td>{item.stock} units</td>
                        <td>{item.demand} units</td>
                        <td>
                          {item.type === 'stockout' && <span className="text-danger-red">₹{item.financialImpact.toLocaleString('en-IN')} (lost)</span>}
                          {item.type === 'overstock' && <span className="text-warning-gold">₹{item.financialImpact.toLocaleString('en-IN')} (spoilage)</span>}
                          {item.type === 'aligned' && '₹0'}
                        </td>
                        <td>
                          {item.type === 'stockout' && <button className="action-btn-sm btn-reorder" onClick={() => handleRestock(item.id)}><i className="fa-solid fa-truck-ramp-box"></i> Restock</button>}
                          {item.type === 'overstock' && <button className="action-btn-sm btn-discount" onClick={() => handleDiscount(item.id)}><i className="fa-solid fa-tags"></i> Discount</button>}
                          {item.type === 'aligned' && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No action needed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TiltCard>

            {/* Promos */}
            <TiltCard className="dashboard-card" maxTilt={2.5} style={{ marginTop: '24px' }}>
              <div className="card-header" style={{ paddingBottom: '12px', marginBottom: '16px' }}>
                <h3><i className="fa-solid fa-tags highlight-orange"></i> Dynamic Promotions & Margins</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="form-control" placeholder="Promo Code (e.g. BOGO)" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} style={{ flexGrow: 1, fontSize: '12px', height: '32px', textTransform: 'uppercase' }} />
                  <input type="number" className="form-control" placeholder="Disc %" value={promoDiscount} onChange={e => setPromoDiscount(e.target.value)} style={{ width: '70px', fontSize: '12px', height: '32px' }} />
                  <button className="btn btn-primary" style={{ height: '32px', padding: '0 16px', fontSize: '12px' }} onClick={handleCreatePromo}>Create</button>
                </div>
                <div className="table-container" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                  <table className="dashboard-table" style={{ fontSize: '11px' }}>
                    <thead><tr><th>Code</th><th>Discount</th><th>Description</th><th>Status</th></tr></thead>
                    <tbody>
                      {promos.map(p => (
                        <tr key={p.code}>
                          <td><strong>{p.code}</strong></td>
                          <td>{p.discount}%</td>
                          <td>{p.description}</td>
                          <td><span className="badge badge-success">{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>
    </>
  );
}
