import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import TiltCard from '../components/TiltCard';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const DAYS_MAP = {
  1: { name: 'Monday', short: 'Mon', multiplier: 0.9, desc: 'Typical weekday dinner traffic.' },
  2: { name: 'Tuesday', short: 'Tue', multiplier: 0.75, desc: 'Mid-week dining lull. Corporate offices report low post-work attendance.' },
  3: { name: 'Wednesday', short: 'Wed', multiplier: 0.95, desc: 'Mid-week traffic pick-up.' },
  4: { name: 'Thursday', short: 'Thu', multiplier: 0.8, desc: 'Sluggish shopping mall footfalls and lack of group catering.' },
  5: { name: 'Friday', short: 'Fri', multiplier: 1.35, desc: 'Weekend kick-off. Heavy dining traffic and high delivery volume.' },
  6: { name: 'Saturday', short: 'Sat', multiplier: 1.65, desc: 'Highest revenue shift of the week. Family group dine-ins.' },
  7: { name: 'Sunday', short: 'Sun', multiplier: 1.5, desc: 'Strong family dinner rush and home deliveries.' },
};

const WEATHER_MAP = {
  1: { name: 'Clear / Cool (Normal)', pizzaMult: 1.0, bevMult: 1.0, impactText: 'Ideal dining conditions. Foot traffic behaves normally.' },
  2: { name: 'Rainy / Monsoon Storm', pizzaMult: 1.1, bevMult: 0.8, impactText: 'Heavy rain slows dine-in traffic (-20%) but spikes home delivery orders (+30%). Logistics transit times are delayed by 25 minutes.' },
  3: { name: 'Severe Hot Heatwave', pizzaMult: 0.85, bevMult: 1.5, impactText: 'Extreme heat discourages dine-in lunches (-15%). Beverage demands spike drastically (+50%). Cold room compressors are under high thermal loads.' },
};

export default function Forecasting() {
  const { db } = useDatabase();
  const [searchParams] = useSearchParams();
  const outlets = db.getOutlets();

  const [selectedOutletId, setSelectedOutletId] = useState(() => searchParams.get('outletId') || (outlets[0]?.id || ''));
  const [dayVal, setDayVal] = useState(2); // Default to Tuesday (Low Sales)
  const [weatherVal, setWeatherVal] = useState(1);
  const [holiday, setHoliday] = useState(false);
  const [promo, setPromo] = useState(false);

  const outlet = outlets.find(o => o.id === selectedOutletId) || outlets[0];

  // Base values from Database
  const baseOrders = outlet?.orders || 100;
  const dayMult = DAYS_MAP[dayVal].multiplier;
  const weatherPizzaMult = WEATHER_MAP[weatherVal].pizzaMult;
  const weatherBevMult = WEATHER_MAP[weatherVal].bevMult;
  const holidayMult = holiday ? 1.25 : 1.0;
  const promoMult = promo ? 1.30 : 1.0;

  // Forecast totals
  const finalPizza = Math.round(baseOrders * dayMult * weatherPizzaMult * holidayMult * promoMult);
  const finalSides = Math.round(finalPizza * 0.45);
  const finalBev = Math.round(finalPizza * 0.8 * weatherBevMult);
  const peakHour = dayVal >= 5 ? '6:30 PM - 10:30 PM' : '7:00 PM - 9:30 PM';

  // Ingredient prep ratios
  const doughBalls = finalPizza + Math.ceil(finalPizza * 0.15);
  const cheeseKg = (finalPizza * 0.14).toFixed(1);
  const sauceLiters = (finalPizza * 0.12).toFixed(1);
  const pepperoniKg = (finalPizza * 0.05).toFixed(1);
  const veggiesKg = (finalPizza * 0.08).toFixed(1);

  // Dynamic status for Selected Day
  const getSalesForecastData = (dayIndex) => {
    let dayObj = DAYS_MAP[dayIndex];
    let mult = dayObj.multiplier * holidayMult * promoMult;
    if (weatherVal === 3) mult *= 0.85; // Heatwave drop

    let val = Math.round(baseOrders * mult);
    let status = 'sufficient';
    let text = 'Target Met';
    let color = '#00b4d8';

    if (mult < 0.85) {
      status = 'low';
      text = 'Low Sales Alert';
      color = '#ff4d6d';
    } else if (mult >= 1.25) {
      status = 'peak';
      text = 'Peak Demand';
      color = '#70e000';
    }
    return { status, text, val, multiplier: mult, color };
  };

  const activeSales = getSalesForecastData(dayVal);

  // Dynamic inventory checks
  const getInventoryStatus = () => {
    const isRainy = weatherVal === 2;
    const isTuesday = dayVal === 2;
    const isWeekend = dayVal >= 5;

    // Mozzarella Cheese
    let cheeseStatus = 'sufficient';
    let cheeseStock = 55;
    let cheeseDemand = Math.round(parseFloat(cheeseKg));
    let cheeseWhy = 'Supply line is balanced. Daily dispatches meeting forecast requirements.';

    if (outlet.id === 'OUT-05' || (isWeekend && isRainy)) {
      cheeseStatus = 'shortage';
      cheeseStock = 12;
      cheeseWhy = `Monsoon storms delayed logistics truck TRK-402 (progress: 40%).`;
    } else if (isTuesday && !promo) {
      cheeseStatus = 'overstock';
      cheeseStock = 95;
      cheeseWhy = `Low Tuesday sales volume combined with no active promotions.`;
    }

    // Slow-Fermented Dough
    let doughStatus = 'sufficient';
    let doughStock = Math.round(doughBalls * 1.05);
    let doughWhy = 'Pre-fermentation dough portions fully prepped and chilled.';
    if (isWeekend && promo) {
      doughStatus = 'shortage';
      doughStock = Math.round(doughBalls * 0.7);
      doughWhy = 'Extreme promo demand outstripping standard 48-hour dough prep cycles.';
    }

    // Pepperoni Slices
    let pepperoniStatus = 'sufficient';
    let pepperoniStock = Math.round(parseFloat(pepperoniKg) * 1.2);
    let pepperoniWhy = 'Pepperoni slices prepped and stored under safe cooling standards.';
    if (outlet.id === 'OUT-01' || outlet.id === 'OUT-17') {
      pepperoniStatus = 'shortage';
      pepperoniStock = 3;
      pepperoniWhy = 'Unexpected surge in regional cured-meat recipes.';
    }

    return [
      { name: 'Artisanal Mozzarella Cheese', status: cheeseStatus, stock: cheeseStock, demand: cheeseDemand, why: cheeseWhy },
      { name: 'Slow-Fermented Dough Portions (12")', status: doughStatus, stock: doughStock, demand: doughBalls, why: doughWhy },
      { name: 'Premium Cured Pepperoni Slices', status: pepperoniStatus, stock: pepperoniStock, demand: Math.round(parseFloat(pepperoniKg)), why: pepperoniWhy },
    ];
  };

  const inventoryList = getInventoryStatus();
  const criticalStockout = inventoryList.find(i => i.status === 'shortage') || null;

  // Dynamic table occupancy model
  const getTableOccupancy = () => {
    const isRainy = weatherVal === 2;
    const isHeatwave = weatherVal === 3;
    const isWeekend = dayVal >= 5;

    // Table 4: VIP Lounge Family Booth
    let t4Count = isWeekend ? 28 : 12;
    let t4Status = isWeekend ? 'peak' : 'sufficient';
    let t4Why = isWeekend ? 'Peak weekend large family group bookings.' : 'Regular corporate lunch dining.';

    // Table 2: Cozy Window Side
    let t2Count = isRainy ? 18 : (isHeatwave ? 4 : 10);
    let t2Status = isRainy ? 'peak' : (isHeatwave ? 'low' : 'sufficient');
    let t2Why = isRainy ? 'Rainy weather view draws strong couple requests.' : (isHeatwave ? 'Direct solar glare makes table uncomfortably hot.' : 'Normal daily rotate.');

    // Table 10: Covered Garden Patio Area
    let t10Count = isRainy ? 0 : (isWeekend ? 34 : 15);
    let t10Status = isRainy ? 'low' : (isWeekend ? 'peak' : 'sufficient');
    let t10Why = isRainy ? 'Patio canopy shut down due to monsoon rain and high wind speeds.' : (isWeekend ? 'Garden deck attracts large weekend parties.' : 'Moderate evening drinks.');

    return [
      { id: 'Table 4 (VIP Family)', peak: 'Fri - Sun Nights', count: t4Count, status: t4Status, why: t4Why },
      { id: 'Table 2 (Window Cozy)', peak: 'Monsoon Evenings', count: t2Count, status: t2Status, why: t2Why },
      { id: 'Table 10 (Garden Patio)', peak: 'Weekend Evenings', count: t10Count, status: t10Status, why: t10Why },
    ];
  };

  const tableList = getTableOccupancy();
  const criticalTableHotspot = tableList.find(t => t.status === 'peak' || t.status === 'low') || tableList[0];

  // Dynamic Wastage Diagnostics based on selected outlet & weather
  const getWastageDiagnostics = () => {
    const isRainy = weatherVal === 2;
    const isTuesday = dayVal === 2;
    const isHeatwave = weatherVal === 3;

    let items = [];
    if (outlet.id === 'OUT-05') {
      // Bopal Crossroad specific wastage
      items.push({
        sku: 'Garlic Herb Butter Base',
        qty: '80 Liters',
        value: 6500,
        why: 'Reduced weekday dine-in sides traffic combined with over-preparation during Monday morning pre-shift setup.',
        action: 'Launch 30% discount on Garlic Bread sides'
      });
      items.push({
        sku: 'Fresh Chopped Veggie Mix',
        qty: '18 kg',
        value: 2160,
        why: isRainy 
          ? 'Heavy monsoon rain alerts caused walk-in customers to drop by 45%. Sliced veggies spoiled without refrigeration capacity.' 
          : 'Low traffic slump on Tuesdays. Staff prepared toppings according to standard weekend baseline ratios.',
        action: 'Re-route toppings to home delivery express menu'
      });
    } else if (outlet.id === 'OUT-12') {
      // Nadiad College Road specific wastage
      items.push({
        sku: 'Chocolate Lava Cakes',
        qty: '150 units',
        value: 12800,
        why: 'Batch expiry approaching in 24 hours. Supplier over-dispatched to meet a cancelled municipal student festival order.',
        action: 'Bundle as free dessert addon for orders above ₹499'
      });
      items.push({
        sku: 'Garlic Breadsticks Pre-Mix',
        qty: '90 units',
        value: 8385,
        why: 'Excess inventory delivery error from central warehouse. Frozen storage units at maximum capacity.',
        action: 'Transfer to nearby Anand branch'
      });
    } else if (isTuesday && !promo) {
      // Default Tuesday low sales wastage
      items.push({
        sku: 'Artisanal Mozzarella Cheese (Overstock)',
        qty: '40 kg',
        value: 14000,
        why: 'Stock ordered based on standard weekend run rates. Leftover raw cheese exposed to ambient room temperature during shift transition.',
        action: 'Place in deep freeze or process into cheese sticks'
      });
      items.push({
        sku: 'Slow-Fermented Dough Batches',
        qty: '30 portions',
        value: 1500,
        why: 'Dough over-fermented beyond the 48-hour peak quality window due to lower-than-expected weekday orders.',
        action: 'Bake as flatbread appetizer samples for dine-in guests'
      });
    } else if (isHeatwave) {
      items.push({
        sku: 'Pizza Dough Portions (Spoiled)',
        qty: '45 units',
        value: 2250,
        why: 'Severe heatwave raised kitchen ambient temperature to 38°C, causing dough yeast to over-activate and collapse before baking.',
        action: 'Calibrate cold proofing room thermostat'
      });
    } else {
      // General low-level wastage
      items.push({
        sku: 'Fresh Chopped Bell Peppers',
        qty: '8 kg',
        value: 960,
        why: 'Standard prep leftover oxidation. Lids were left off storage tubs during rush hours.',
        action: 'Optimize prep schedule'
      });
    }

    const totalVal = items.reduce((sum, item) => sum + item.value, 0);
    return { items, totalVal };
  };

  const wastageReport = getWastageDiagnostics();

  // Chart 1: Weekly Predictive Orders Curve
  const weeklyForecastData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Predicted Orders',
        data: [1, 2, 3, 4, 5, 6, 7].map(idx => getSalesForecastData(idx).val),
        borderColor: 'rgba(255, 107, 53, 1)',
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(255, 107, 53, 1)',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0c0e12',
        titleFont: { family: 'Outfit', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 11 },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ea8b6', font: { size: 9 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9ea8b6', font: { size: 9 } } }
    }
  };

  // Chart 2: Inventory Financial Risk Doughnut
  const alignedValue = 45000;
  const stockoutValue = criticalStockout ? 8500 : 0;
  const wastageValue = wastageReport.totalVal;

  const doughnutData = {
    labels: ['Wastage Risk', 'Stockout Threat', 'Sufficiently Aligned'],
    datasets: [
      {
        data: [wastageValue, stockoutValue, alignedValue],
        backgroundColor: [
          'rgba(255, 183, 3, 0.8)',   // Yellow for overstock/wastage
          'rgba(217, 4, 41, 0.8)',    // Red for shortage/stockout
          'rgba(0, 180, 216, 0.8)'    // Blue for aligned
        ],
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9ea8b6',
          font: { family: 'Inter', size: 9 },
          boxWidth: 10
        }
      },
      tooltip: {
        backgroundColor: '#0c0e12',
        bodyFont: { family: 'Inter', size: 11 },
        callbacks: {
          label: (context) => ` ${context.label}: ₹${context.raw.toLocaleString('en-IN')}`
        }
      }
    },
    cutout: '65%'
  };

  return (
    <>
      <TopHeader title="AI Forecasting & Operations Dashboard" />
      <section className="content-body">
        
        {/* Scenario Controls Panel */}
        <div style={{ marginBottom: '24px' }}>
          <TiltCard className="config-pane" maxTilt={1} style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="form-group" style={{ flex: '1 1 220px', marginBottom: 0 }}>
                <label htmlFor="fc-outlet" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Branch</label>
                <select id="fc-outlet" className="form-control" value={selectedOutletId} onChange={e => setSelectedOutletId(e.target.value)} style={{ height: '36px', padding: '4px 10px', fontSize: '13px' }}>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name} ({o.city})</option>)}
                </select>
              </div>

              <div className="slider-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                <div className="slider-header" style={{ fontSize: '11px' }}>
                  <span><i className="fa-regular fa-calendar"></i> Target Day of Week</span>
                  <strong>{DAYS_MAP[dayVal].name}</strong>
                </div>
                <input type="range" className="slider-control" min="1" max="7" value={dayVal} onChange={e => setDayVal(Number(e.target.value))} />
              </div>

              <div className="slider-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                <div className="slider-header" style={{ fontSize: '11px' }}>
                  <span><i className="fa-solid fa-cloud-sun"></i> Weather Forecast</span>
                  <strong>{WEATHER_MAP[weatherVal].name}</strong>
                </div>
                <input type="range" className="slider-control" min="1" max="3" value={weatherVal} onChange={e => setWeatherVal(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
              <label className="checklist-switch" style={{ fontSize: '12px' }}>
                <input type="checkbox" checked={holiday} onChange={e => setHoliday(e.target.checked)} />
                <span><i className="fa-solid fa-star text-gold"></i> Holiday/Event Day (+25% Dine-in)</span>
              </label>
              <label className="checklist-switch" style={{ fontSize: '12px' }}>
                <input type="checkbox" checked={promo} onChange={e => setPromo(e.target.checked)} />
                <span><i className="fa-solid fa-tags text-orange"></i> Active Promo Campaign (+30% Volume)</span>
              </label>
            </div>
          </TiltCard>
        </div>

        {/* HIGHLIGHTED MAIN DATA (KPI Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* KPI 1: Primary Sales Forecast Alert */}
          <TiltCard className="stat-card" maxTilt={3} style={{ display: 'flex', flexDirection: 'column', minHeight: '160px', border: activeSales.status === 'low' ? '1px solid rgba(217, 4, 41, 0.2)' : '1px solid var(--border-glass)' }}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p style={{ textTransform: 'uppercase', fontSize: '11px' }}>Sales Outlook Alert</p>
              <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', color: activeSales.color }}>
                {activeSales.val} <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>Orders</span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: '700', color: activeSales.color }}>
                <i className={activeSales.status === 'low' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'}></i> {activeSales.status === 'low' ? `${Math.round((1 - activeSales.multiplier) * 100)}% Slump Predicted` : activeSales.text}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.3' }}>
                <strong>Why:</strong> {DAYS_MAP[dayVal].desc} {weatherVal === 2 && 'Heavy rain drops dine-in and logistics courier availability.'}
              </div>
            </div>
          </TiltCard>

          {/* KPI 2: Spoilage & Wastage Financial Risk Alert */}
          <TiltCard className="stat-card" maxTilt={3} style={{ display: 'flex', flexDirection: 'column', minHeight: '160px', border: wastageReport.totalVal > 5000 ? '1px solid rgba(255, 183, 3, 0.2)' : '1px solid var(--border-glass)' }}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p style={{ textTransform: 'uppercase', fontSize: '11px' }}>AI Projected Spoilage Risk</p>
              <div className="stat-value" style={{ color: '#ffb703', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                ₹{wastageReport.totalVal.toLocaleString('en-IN')} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Wastage Cost</span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: '700', color: '#ffb703' }}>
                <i className="fa-solid fa-dumpster-fire"></i> {wastageReport.items.length} Ingredients Flagged for Waste
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.3' }}>
                <strong>Why:</strong> Shelf-life expiration and low weekday order rates under active weather conditions.
              </div>
            </div>
          </TiltCard>

          {/* KPI 3: Table Hotspot & Seating Capacity Alert */}
          <TiltCard className="stat-card" maxTilt={3} style={{ display: 'flex', flexDirection: 'column', minHeight: '160px', border: criticalTableHotspot.status === 'peak' ? '1px solid rgba(0, 180, 216, 0.2)' : '1px solid var(--border-glass)' }}>
            <div className="stat-info" style={{ flexGrow: 1 }}>
              <p style={{ textTransform: 'uppercase', fontSize: '11px' }}>Table Hotspot Analysis</p>
              <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', color: criticalTableHotspot.status === 'peak' ? 'var(--info)' : '#ff4d6d' }}>
                {criticalTableHotspot.count} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Guests Expected</span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: '700', color: criticalTableHotspot.status === 'peak' ? 'var(--info)' : '#ff4d6d' }}>
                <i className={criticalTableHotspot.status === 'peak' ? 'fa-solid fa-chair' : 'fa-solid fa-circle-minus'}></i> {criticalTableHotspot.id}: {criticalTableHotspot.status === 'peak' ? 'Peak Seating Hotspot' : 'Section Closed'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.3' }}>
                <strong>Why:</strong> {criticalTableHotspot.why}
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Heavy Visualizations Grid Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          {/* Chart 1: Sales Predictor Weekly Curve */}
          <TiltCard className="prep-plan-card" maxTilt={1}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3><i className="fa-solid fa-chart-line highlight-orange"></i> Weekly Orders Predictive Trend Curve</h3>
              <span className="badge badge-info">Dynamically Updates with Controls</span>
            </div>
            <div style={{ height: '220px', position: 'relative' }}>
              <Line data={weeklyForecastData} options={lineChartOptions} />
            </div>
          </TiltCard>

          {/* Chart 2: Inventory Financial Exposure */}
          <TiltCard className="prep-plan-card" maxTilt={1}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3><i className="fa-solid fa-chart-pie highlight-orange"></i> Inventory Financial Exposure</h3>
              <span className="badge badge-success">Capital Risk Ratio</span>
            </div>
            <div style={{ height: '220px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </TiltCard>

        </div>

        {/* Dynamic Timeline Selector */}
        <div style={{ marginBottom: '24px' }}>
          <TiltCard className="prep-plan-card" maxTilt={1}>
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <h3><i className="fa-regular fa-calendar-days highlight-orange"></i> Weekday Horizon Selector</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(dIdx => {
                const forecast = getSalesForecastData(dIdx);
                const isSelected = dIdx === dayVal;
                return (
                  <button 
                    key={dIdx} 
                    onClick={() => setDayVal(dIdx)} 
                    style={{
                      flex: '1',
                      margin: '0 4px',
                      background: isSelected ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.01)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{DAYS_MAP[dIdx].short}</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>{forecast.val}</span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: forecast.color }}></span>
                  </button>
                );
              })}
            </div>
          </TiltCard>
        </div>

        {/* Inventory Wastage & Spoilage Diagnostics (New Dedicated Section) */}
        <div style={{ marginBottom: '24px' }}>
          <TiltCard className="prep-plan-card" maxTilt={1} style={{ border: '1px solid rgba(255, 183, 3, 0.25)' }}>
            <div className="card-header" style={{ marginBottom: '18px' }}>
              <h3><i className="fa-solid fa-dumpster highlight-orange"></i> AI Spoilage & Inventory Wastage Diagnostics</h3>
              <span className="badge badge-warning">Financial Leakage Report</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {wastageReport.items.map((item, idx) => (
                <div key={idx} className="dashboard-list-item" style={{ borderLeft: '3px solid #ffb703', background: 'rgba(255, 183, 3, 0.02)', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>{item.sku}</h4>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffb703' }}>₹{item.value.toLocaleString('en-IN')} loss</span>
                  </div>
                  
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Wastage quantity: <strong>{item.qty}</strong>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                    <strong>Why:</strong> {item.why}
                  </div>

                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: '#ffb703', fontWeight: '600' }}><i className="fa-solid fa-triangle-exclamation"></i> ACTION REQUIRED</span>
                    <button className="btn-outline-sm" style={{ fontSize: '9px', padding: '3px 8px', borderColor: '#ffb703', color: '#ffb703' }}>
                      {item.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>
        </div>

        {/* Detailed Diagnostics Grids */}
        <div className="forecasting-dashboard-grid" style={{ marginTop: 0 }}>
          
          {/* Supply Chain Details */}
          <TiltCard className="prep-plan-card" maxTilt={2}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3><i className="fa-solid fa-boxes-stacked highlight-orange"></i> Supply Chain Demand Detail</h3>
              <span className="badge badge-success">Stock vs Forecast</span>
            </div>

            <div className="dashboard-list">
              {inventoryList.map((item, idx) => (
                <div key={idx} className="dashboard-list-item" style={{ background: item.status === 'shortage' ? 'rgba(217, 4, 41, 0.02)' : 'rgba(255,255,255,0.01)' }}>
                  <div className="list-item-header">
                    <span className="list-item-name">{item.name}</span>
                    <span className={`status-badge-custom ${item.status}`}>{item.status}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Live Stock: <strong>{item.stock} kg</strong></span>
                    <span>Forecasted Need: <strong>{item.demand} kg</strong></span>
                  </div>

                  <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{
                      height: '100%',
                      background: item.status === 'shortage' ? '#ff4d6d' : (item.status === 'overstock' ? '#ffb703' : '#00b4d8'),
                      width: `${Math.min((item.stock / item.demand) * 100, 100)}%`
                    }}></div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                    <strong>Mismatch Reason:</strong> {item.why}
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>

          {/* Seating Allocations Details */}
          <TiltCard className="prep-plan-card" maxTilt={2}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3><i className="fa-solid fa-chair highlight-orange"></i> Table Occupancy & Seating Detail</h3>
              <span className="badge badge-info">Dining Hall Allocation</span>
            </div>

            <div className="dashboard-list">
              {tableList.map((table, idx) => (
                <div key={idx} className="dashboard-list-item" style={{ background: table.status === 'low' ? 'rgba(217, 4, 41, 0.02)' : 'rgba(255,255,255,0.01)' }}>
                  <div className="list-item-header">
                    <span className="list-item-name">{table.id}</span>
                    <span className={`status-badge-custom ${table.status}`}>{table.status === 'peak' ? 'High Traffic' : (table.status === 'low' ? 'Unused / Closed' : 'Moderate')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>Peak Times: <strong>{table.peak}</strong></span>
                    <span>Expected Traffic: <strong>{table.count} guests</strong></span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                    <strong>Capacity Factor:</strong> {table.why}
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>

        </div>
      </section>
    </>
  );
}
