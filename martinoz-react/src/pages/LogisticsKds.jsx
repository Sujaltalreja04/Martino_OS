import { useState } from 'react';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import TiltCard from '../components/TiltCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function buildHourLabels() {
  const labels = [];
  const baseHour = new Date().getHours();
  for (let i = 5; i >= 0; i--) labels.push(`${(baseHour - i + 24) % 24}:00`);
  return labels;
}

function generateHistory(base, variance) {
  const labels = buildHourLabels();
  return labels.map((_, i) => i === 5 ? base : parseFloat((base + (Math.random() - 0.5) * variance).toFixed(1)));
}

export default function LogisticsKds() {
  const { db, refresh } = useDatabase();
  const outlets = db.getOutlets().sort((a, b) => a.name.localeCompare(b.name));

  const [kdsOutletFilter, setKdsOutletFilter] = useState('all');
  const [telemetryOutletId, setTelemetryOutletId] = useState('OUT-05');

  const kdsData = db.getKds();
  const iotData = db.getIot();
  const shipments = db.getShipments();

  const filteredKds = (kdsOutletFilter === 'all' ? kdsData : kdsData.filter(o => o.outletId === kdsOutletFilter))
    .sort((a, b) => ({ 'Preparing': 1, 'Baking': 2, 'Ready': 3 }[a.status] - { 'Preparing': 1, 'Baking': 2, 'Ready': 3 }[b.status]));

  const kdsTicketCount = filteredKds.length;
  const avgPrep = filteredKds.length > 0 ? Math.round(filteredKds.reduce((s, o) => s + o.prepTimeMinutes, 0) / filteredKds.length) : 0;

  const activeLog = iotData.find(l => l.outletId === telemetryOutletId) || { fridgeTemp: 3.0, ovenTemp: 240 };
  const fridgeWarning = activeLog.fridgeTemp > 5.0;

  const labels = buildHourLabels();
  const fridgeHistory = generateHistory(activeLog.fridgeTemp, 0.8);
  const ovenHistory = generateHistory(activeLog.ovenTemp, 12);

  const fridgeChartData = {
    labels,
    datasets: [{
      label: 'Cold Storage (°C)', data: fridgeHistory, backgroundColor: 'rgba(0, 180, 216, 0.4)',
      borderColor: '#00b4d8', borderWidth: 2, pointBackgroundColor: '#00b4d8', fill: true, tension: 0.3
    }]
  };
  const ovenChartData = {
    labels,
    datasets: [{
      label: 'Baking Oven (°C)', data: ovenHistory, backgroundColor: 'rgba(255, 107, 53, 0.4)',
      borderColor: '#ff6b35', borderWidth: 2, pointBackgroundColor: '#ff6b35', fill: true, tension: 0.3
    }]
  };
  const lineOptions = (yMin, yMax) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0c0e12', borderWidth: 1 } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ea8b6', font: { size: 9 } } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#9ea8b6', font: { size: 9 } }, suggestedMin: yMin, suggestedMax: yMax }
    }
  });

  const kdsStatusBadge = (status) => {
    if (status === 'Preparing') return 'badge-warning';
    if (status === 'Baking') return 'badge-danger';
    return 'badge-success';
  };
  const shipmentBadge = (status) => {
    if (status === 'Delivered') return 'badge-success';
    if (status === 'Near Destination') return 'badge-warning';
    return 'badge-info';
  };

  const handleAdvanceStatus = (orderId) => {
    const kds = db.getKds();
    const order = kds.find(o => o.id === orderId);
    if (order) {
      if (order.status === 'Preparing') {
        order.status = 'Baking';
      } else if (order.status === 'Baking') {
        order.status = 'Ready';
      } else if (order.status === 'Ready') {
        const idx = kds.indexOf(order);
        if (idx > -1) kds.splice(idx, 1);
      }
      db.saveKds(kds);
      refresh();
    }
  };

  const handleUpdateShipment = (shipmentId) => {
    const shipmentsList = db.getShipments();
    const s = shipmentsList.find(x => x.id === shipmentId);
    if (s) {
      if (s.progress < 100) {
        s.progress = Math.min(s.progress + 20, 100);
        if (s.progress === 100) {
          s.status = 'Delivered';
        } else if (s.progress >= 80) {
          s.status = 'Near Destination';
        } else {
          s.status = 'In Transit';
        }
        db.saveShipments(shipmentsList);
        refresh();
      }
    }
  };

  const handleDispatchNewShipment = () => {
    const shipmentsList = db.getShipments();
    const newId = `TRK-${400 + shipmentsList.length + 1}`;
    const targetOutlets = outlets.filter(o => o.alertStatus !== 'normal');
    const target = targetOutlets.length > 0 ? targetOutlets[Math.floor(Math.random() * targetOutlets.length)] : outlets[Math.floor(Math.random() * outlets.length)];
    
    shipmentsList.unshift({
      id: newId,
      origin: 'Ahmedabad HQ',
      destination: target.name,
      cargo: '150kg Cheese, 100kg Dough Mix',
      progress: 0,
      status: 'In Transit',
      driver: ['Amit Sen', 'Rajesh Kumar', 'Karan Verma', 'Sanjay Dutt'][Math.floor(Math.random() * 4)]
    });
    db.saveShipments(shipmentsList);
    refresh();
  };

  return (
    <>
      <TopHeader title="Kitchen, IoT & Supply Chain Logistics Hub" />
      <section className="content-body" style={{ padding: '24px' }}>
        <div className="grid-logistics-main">
          {/* KDS Column */}
          <div className="logistics-col">
            <TiltCard className="logistics-card" maxTilt={2.5}>
              <div className="card-header" style={{ paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3><i className="fa-solid fa-fire highlight-orange"></i> Live Kitchen KDS Queue</h3>
                <select className="form-control" value={kdsOutletFilter} onChange={e => setKdsOutletFilter(e.target.value)} style={{ width: '120px', fontSize: '11px', height: '28px', padding: '2px 8px', marginBottom: 0 }}>
                  <option value="all">All Outlets</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '6px' }}>
                <div>Avg Prep Time: <strong className="highlight-orange">{avgPrep}m</strong></div>
                <div>Active Tickets: <strong className="highlight-gold">{kdsTicketCount}</strong></div>
              </div>
              <div className="card-body-scroll">
                {filteredKds.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
                    <i className="fa-solid fa-circle-check text-success-green" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                    No active tickets in queue.
                  </div>
                ) : filteredKds.map(o => {
                  const outletName = outlets.find(ou => ou.id === o.outletId)?.name || 'Unknown';
                  return (
                    <div key={o.id} className="kds-order-item" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="kds-order-header">
                        <div className="kds-order-customer">{o.customerName}</div>
                        <span className={`badge ${kdsStatusBadge(o.status)}`}>{o.status}</span>
                      </div>
                      <div className="kds-order-items">{o.items}</div>
                      <div className="kds-order-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span className="kds-order-id">{o.id} | {outletName}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="kds-order-time"><i className="fa-solid fa-clock"></i> {o.prepTimeMinutes}m</span>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleAdvanceStatus(o.id)} 
                            style={{ 
                              fontSize: '10px', 
                              padding: '2px 8px', 
                              background: o.status === 'Preparing' ? 'var(--primary)' : (o.status === 'Baking' ? '#ffb703' : '#38b000'), 
                              borderColor: 'transparent',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            {o.status === 'Preparing' ? '🔥 Bake' : (o.status === 'Baking' ? '✅ Ready' : '📦 Serve')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TiltCard>
          </div>

          {/* IoT Column */}
          <div className="logistics-col">
            <TiltCard className="logistics-card" maxTilt={2.5}>
              <div className="card-header" style={{ paddingBottom: '8px', marginBottom: '12px' }}>
                <h3><i className="fa-solid fa-temperature-three-quarters text-blue"></i> Real-time IoT Telemetry</h3>
                <select className="form-control" value={telemetryOutletId} onChange={e => setTelemetryOutletId(e.target.value)} style={{ width: '120px', fontSize: '11px', height: '28px', padding: '2px 8px' }}>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="telemetry-status-box" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <div className="telemetry-label">Cold Storage</div>
                    <div className={`telemetry-value ${fridgeWarning ? 'text-danger-red' : 'text-blue'}`}>{activeLog.fridgeTemp.toFixed(1)}°C</div>
                  </div>
                  <i className="fa-solid fa-snowflake text-blue" style={{ fontSize: '20px' }}></i>
                </div>
                <div className="telemetry-status-box" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <div className="telemetry-label">Baking Oven</div>
                    <div className="telemetry-value highlight-orange">{activeLog.ovenTemp}°C</div>
                  </div>
                  <i className="fa-solid fa-fire highlight-orange" style={{ fontSize: '20px' }}></i>
                </div>
              </div>
              {fridgeWarning && (
                <div className="ai-alert-item critical" style={{ display: 'flex', padding: '8px 12px', marginTop: '4px', fontSize: '11px', gap: '8px' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '14px', marginTop: '2px' }}></i>
                  <div>
                    <strong style={{ display: 'block' }}>Dairy Spoilage Risk Warning!</strong>
                    Fridge temperature exceeded standard compliance threshold (&gt;5.0°C).
                  </div>
                </div>
              )}
              <div className="iot-chart-container">
                <Line data={fridgeChartData} options={lineOptions(1, 7)} />
              </div>
              <div className="iot-chart-container" style={{ marginTop: '10px' }}>
                <Line data={ovenChartData} options={lineOptions(200, 270)} />
              </div>
            </TiltCard>
          </div>

          {/* Shipments Column */}
          <div className="logistics-col">
            <TiltCard className="logistics-card" maxTilt={2.5}>
              <div className="card-header" style={{ paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3><i className="fa-solid fa-truck-fast highlight-green"></i> Supply Chain Logistics</h3>
                <button className="btn-outline-sm" onClick={handleDispatchNewShipment} style={{ fontSize: '10px', padding: '2px 8px' }}><i className="fa-solid fa-plus"></i> Dispatch</button>
              </div>
              <div className="card-body-scroll">
                {shipments.map(s => (
                  <div key={s.id} className="shipment-item" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div className="shipment-header">
                      <div className="shipment-route"><i className="fa-solid fa-route"></i> {s.destination}</div>
                      <span className={`badge ${shipmentBadge(s.status)}`}>{s.status}</span>
                    </div>
                    <div className="shipment-cargo"><strong>Cargo:</strong> {s.cargo}</div>
                    <div className="shipment-progress-bg">
                      <div className="shipment-progress-bar" style={{ width: `${s.progress}%` }}></div>
                    </div>
                    <div className="shipment-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Truck: {s.id} | Driver: {s.driver}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {s.progress < 100 ? (
                          <button className="btn-outline-sm" onClick={() => handleUpdateShipment(s.id)} style={{ fontSize: '9px', padding: '2px 6px', borderColor: 'var(--success)' }}>
                            Drive 🚚
                          </button>
                        ) : (
                          <span style={{ fontSize: '9px', color: 'var(--success)', fontWeight: 'bold' }}>Arrived</span>
                        )}
                        <strong>{s.progress}%</strong>
                      </div>
                    </div>
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
