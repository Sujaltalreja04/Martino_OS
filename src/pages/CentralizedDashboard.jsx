import { useState } from 'react';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import TiltCard from '../components/TiltCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function CentralizedDashboard() {
  const { db } = useDatabase();
  const [selectedDay, setSelectedDay] = useState('Friday');
  
  const consumerData = db.getConsumerData();
  const rawMaterials = db.getRawMaterials();
  const financialStats = db.getFinancialStats();
  const outlets = db.getOutlets();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // 1. Consumer Data filtering
  const filteredConsumerData = consumerData.filter(d => d.day === selectedDay);
  
  // Create a mapping of outletId to outletName
  const outletMap = {};
  outlets.forEach(o => { outletMap[o.id] = o.name; });

  // 2. Raw Material filtering
  const understock = rawMaterials.filter(rm => rm.status === 'Understock');
  const overstock = rawMaterials.filter(rm => rm.status === 'Overstock');
  const normalStock = rawMaterials.filter(rm => rm.status === 'Normal');

  // 3. Financial percentages
  const salesProgress = Math.min((financialStats.actualSales / financialStats.budgetedSales) * 100, 100) || 0;
  const expenseProgress = Math.min((financialStats.actualExpense / financialStats.budgetedExpense) * 100, 100) || 0;

  // Chart Data Configuration
  const financialChartData = {
    labels: ['Sales', 'Expenses'],
    datasets: [
      {
        label: 'Budget',
        data: [financialStats.budgetedSales, financialStats.budgetedExpense],
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      },
      {
        label: 'Actual',
        data: [financialStats.actualSales, financialStats.actualExpense],
        backgroundColor: [
          'rgba(56, 189, 106, 0.8)', // Green for Sales
          financialStats.actualExpense > financialStats.budgetedExpense ? 'rgba(220, 53, 69, 0.8)' : 'rgba(255, 183, 3, 0.8)' // Red/Orange for Expense
        ],
        borderColor: [
          'rgba(56, 189, 106, 1)',
          financialStats.actualExpense > financialStats.budgetedExpense ? 'rgba(220, 53, 69, 1)' : 'rgba(255, 183, 3, 1)'
        ],
        borderWidth: 1,
      }
    ]
  };

  const financialChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#fff' } },
      title: { display: false }
    },
    scales: {
      y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#aaa' }, grid: { display: false } }
    }
  };

  const rawMaterialChartData = {
    labels: ['Critical Understock', 'Heavy Overstock', 'Healthy'],
    datasets: [
      {
        data: [understock.length, overstock.length, normalStock.length],
        backgroundColor: [
          'rgba(220, 53, 69, 0.8)', // Red
          'rgba(255, 183, 3, 0.8)', // Yellow/Orange
          'rgba(56, 189, 106, 0.8)' // Green
        ],
        borderWidth: 0,
      }
    ]
  };

  const rawMaterialChartOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { color: '#fff' } },
    },
    cutout: '70%'
  };

  return (
    <>
      <TopHeader title="Centralized Operations Center" />
      <section className="content-body">
        
        {/* Financial Tracker Row */}
        <div className="grid-dashboard-main" style={{ gridTemplateColumns: '1fr', marginBottom: '20px' }}>
          <TiltCard className="dashboard-card animate-fade-in-up anim-delay-1" maxTilt={2}>
            <div className="card-header">
              <h3><i className="fa-solid fa-scale-balanced text-gold"></i> Financial Budget vs Actuals</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="financial-panel">
                  <h4><i className="fa-solid fa-arrow-trend-up text-green"></i> Sales Performance</h4>
                  <div className="budget-metrics">
                    <div>Actual: <strong className="text-green">₹{(financialStats.actualSales || 0).toLocaleString('en-IN')}</strong></div>
                    <div>Budget: ₹{(financialStats.budgetedSales || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="stat-progress mt-2" style={{ height: '12px' }}>
                    <div className="stat-progress-bar bg-green" style={{ width: `${salesProgress}%` }}></div>
                  </div>
                  <p className="mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{salesProgress.toFixed(1)}% of Budget Achieved</p>
                </div>

                <div className="financial-panel">
                  <h4><i className="fa-solid fa-arrow-trend-down text-orange"></i> Expense Tracking</h4>
                  <div className="budget-metrics">
                    <div>Actual: <strong className={financialStats.actualExpense > financialStats.budgetedExpense ? "text-danger" : "text-orange"}>₹{(financialStats.actualExpense || 0).toLocaleString('en-IN')}</strong></div>
                    <div>Budget: ₹{(financialStats.budgetedExpense || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="stat-progress mt-2" style={{ height: '12px' }}>
                    <div className={`stat-progress-bar ${financialStats.actualExpense > financialStats.budgetedExpense ? 'bg-danger' : 'bg-orange'}`} style={{ width: `${expenseProgress}%` }}></div>
                  </div>
                  <p className="mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{expenseProgress.toFixed(1)}% of Budget Consumed</p>
                </div>
              </div>
              <div style={{ height: '250px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <Bar data={financialChartData} options={financialChartOptions} />
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Two Column Layout for Consumer Data & Raw Materials */}
        <div className="grid-dashboard-main">
          
          {/* Left Column: Consumer Data */}
          <div className="left-col">
            <TiltCard className="dashboard-card animate-fade-in-up anim-delay-2" maxTilt={3}>
              <div className="card-header">
                <h3><i className="fa-solid fa-users-viewfinder text-primary"></i> Live Consumer Footfall Map</h3>
                <select className="input-glass" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                  {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="footfall-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredConsumerData.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No seating data available for this day.</p>
                ) : (
                  filteredConsumerData.map((data, idx) => (
                    <div key={idx} className="footfall-item" style={{ background: 'var(--surface-mixed)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem' }}>{outletMap[data.outletId] || data.outletId}</strong>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Peak Time: {data.peakHour}</span>
                        </div>
                        <div className={`badge ${data.occupancyRate > 90 ? 'badge-danger' : data.occupancyRate > 75 ? 'badge-warning' : 'badge-info'}`}>
                          {data.occupancyRate}% Full
                        </div>
                      </div>
                      <div className="seating-visualizer" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {/* Render dots for seats, just a visual representation (e.g. 1 dot = 5 seats) */}
                        {Array.from({ length: Math.ceil(data.totalSeats / 5) }).map((_, i) => (
                          <div key={i} style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: i < Math.ceil(data.seatsFull / 5) 
                              ? (data.occupancyRate > 90 ? 'var(--danger)' : 'var(--primary)') 
                              : 'rgba(255,255,255,0.1)'
                          }}></div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                        {data.seatsFull} / {data.totalSeats} Seats Occupied
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TiltCard>
          </div>

          {/* Right Column: Raw Material Tracker */}
          <div className="right-col">
            <TiltCard className="dashboard-card animate-fade-in-up anim-delay-3" maxTilt={3}>
              <div className="card-header">
                <h3><i className="fa-solid fa-boxes-stacked text-orange"></i> Raw Material Pulse</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Doughnut data={rawMaterialChartData} options={rawMaterialChartOptions} />
                </div>
                
                {/* Understock Alert */}
                <div className="material-section">
                  <h4 style={{ color: 'var(--danger)', marginBottom: '10px' }}><i className="fa-solid fa-triangle-exclamation"></i> Critical Understock</h4>
                  <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="dashboard-table">
                      <thead><tr><th>Item</th><th>Stock</th><th>Action</th></tr></thead>
                      <tbody>
                        {understock.map(rm => (
                          <tr key={rm.id}>
                            <td>{rm.name}</td>
                            <td><strong className="text-danger">{rm.stockKg}</strong></td>
                            <td><button className="btn btn-sm btn-danger-outline" style={{ fontSize: '0.7rem' }}>Order</button></td>
                          </tr>
                        ))}
                        {understock.length === 0 && <tr><td colSpan="3" className="text-center">No critical understock</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Overstock Alert */}
              <div className="material-section mb-3">
                <h4 style={{ color: 'var(--warning)', marginBottom: '10px' }}><i className="fa-solid fa-circle-exclamation"></i> Heavy Overstock</h4>
                <div className="table-container">
                  <table className="dashboard-table">
                    <thead><tr><th>Item</th><th>Stock</th><th>Variance</th><th>AI Insight</th></tr></thead>
                    <tbody>
                      {overstock.map(rm => (
                        <tr key={rm.id}>
                          <td>{rm.name}</td>
                          <td><strong className="text-warning">{rm.stockKg} {rm.id === 'RM-05' ? 'units' : 'kg'}</strong></td>
                          <td>+{(rm.stockKg - rm.parLevelKg)} {rm.id === 'RM-05' ? 'units' : 'kg'}</td>
                          <td><span className="badge badge-warning">Push Promo</span></td>
                        </tr>
                      ))}
                      {overstock.length === 0 && <tr><td colSpan="4" className="text-center">No overstock detected</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Normal Stock Preview */}
              <div className="material-section">
                <h4 style={{ color: 'var(--success)', marginBottom: '10px' }}><i className="fa-solid fa-circle-check"></i> Healthy Inventory</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {normalStock.map(rm => (
                    <div key={rm.id} className="badge" style={{ background: 'rgba(56, 176, 0, 0.1)', color: 'var(--success)', border: '1px solid rgba(56, 176, 0, 0.3)' }}>
                      {rm.name}
                    </div>
                  ))}
                </div>
              </div>

            </TiltCard>
          </div>

        </div>
      </section>
    </>
  );
}
