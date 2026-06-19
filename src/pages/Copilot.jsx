import { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHAT_HISTORY_LS = 'martinoz_fip_copilot_chat';

const METRIC_TITLES = {
  sales: 'Sales Performance (₹)',
  hygiene: 'Hygiene Compliance (%)',
  wastage: 'Food Wastage (kg)',
  complaints: 'Active CRM Complaints',
  inventory: 'Stock vs Demand Alignment',
  latency: 'Kitchen Prep Latency (mins)',
  telemetry: 'IoT Cold Store Telemetry (°C)',
  logistics: 'Ingredient Distribution Shipments (%)',
};

const METRIC_COLORS = {
  sales: { bg: 'rgba(255, 107, 53, 0.75)', border: 'rgba(255, 107, 53, 1)' },
  hygiene: { bg: 'rgba(56, 176, 0, 0.25)', border: 'rgba(56, 176, 0, 1)' },
  wastage: { bg: ['rgba(255, 183, 3, 0.75)', 'rgba(255, 107, 53, 0.75)', 'rgba(0, 180, 216, 0.75)', 'rgba(217, 4, 41, 0.75)', 'rgba(112, 224, 0, 0.75)'], border: '#ffffff0d' },
  complaints: { bg: 'rgba(217, 4, 41, 0.75)', border: 'rgba(217, 4, 41, 1)' },
  latency: { bg: 'rgba(255, 183, 3, 0.75)', border: 'rgba(255, 183, 3, 1)' },
  telemetry: { bg: 'rgba(0, 180, 216, 0.25)', border: 'rgba(0, 180, 216, 1)' },
  logistics: { bg: 'rgba(56, 176, 0, 0.75)', border: 'rgba(56, 176, 0, 1)' },
  inventory: { bg: 'rgba(255, 107, 53, 0.75)', border: 'rgba(255, 107, 53, 1)' },
};

const SUGGESTIONS = [
  { label: '📊 Plot All Sales', query: 'Draw a chart of sales performance across all outlets' },
  { label: '🛡️ Plot Hygiene Radar', query: 'Show me compliance hygiene ratings for all cities' },
  { label: '🥖 Waste Doughnut Chart', query: 'Plot a wastage graph for Ahmedabad locations' },
  { label: '📈 Telemetry Line Graph', query: "Show telemetry cold storage temperatures" },
];

function parseMarkdown(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\* (.*?)(<br>|$)/g, '<li>$1</li>');
}

export default function Copilot() {
  const { db } = useDatabase();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copilotMode, setCopilotMode] = useState('both'); // 'both' (Text & Graph) or 'graph' (Graph Only Focus)
  const feedRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_LS);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{
        role: 'agent', content: `Hello! I am the **Martinoz Operations Copilot**.\n\nI have direct access to our real-time sales registry, customer complaints CRM, and food safety checklists.\n\nAsk me questions or command me to plot visuals:\n* **"Plot a sales chart of Surat outlets"**\n* **"Show me the hygiene scores for Ahmedabad"**\n* **"Which branches are at critical compliance risk?"**`
      }]);
    }
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    if (messages.length > 0) localStorage.setItem(CHAT_HISTORY_LS, JSON.stringify(messages));
  }, [messages]);

  function buildSystemContext() {
    const stats = db.getGlobalStats();
    const outlets = db.getOutlets();
    const tickets = db.getTickets().filter(t => t.status !== 'Resolved');
    const inventory = db.getInventory();
    const skus = db.getSkus();
    const statsInv = db.getInventoryStats();
    const kds = db.getKds() || [];
    const iot = db.getIot() || [];
    const shipments = db.getShipments() || [];
    const promos = db.getPromos() || [];

    const outletsSummary = outlets.map(o =>
      `- ${o.id}: ${o.name} (${o.city}) | Sales: ₹${o.sales} | Orders: ${o.orders} | Hygiene: ${o.hygieneScore}% | Tickets: ${o.openComplaints} | Wastage: ${o.wastageKg.toFixed(1)}kg`
    ).join('\n');
    const ticketsSummary = tickets.map(t =>
      `- ${t.id}: ${t.outletName} (${t.outletId}) | Category: ${t.category} | Urgency: ${t.priority} | Desc: "${t.description}"`
    ).join('\n');
    const kdsSummary = kds.map(o => `- Order ${o.id} (${outlets.find(ou => ou.id === o.outletId)?.name}): Customer: ${o.customerName} | Status: ${o.status} | Prep Time: ${o.prepTimeMinutes}m`).join('\n');
    const iotSummary = iot.map(t => `- ${outlets.find(ou => ou.id === t.outletId)?.name} (${t.outletId}): Fridge Temp: ${t.fridgeTemp}°C | Oven Temp: ${t.ovenTemp}°C`).join('\n');
    const shipmentsSummary = shipments.map(s => `- Ship ${s.id} to ${s.destination}: Status: ${s.status} | Progress: ${s.progress}%`).join('\n');

    return `You are the operations AI Copilot for Martinoz Pizza Corporate Headquarters (FIP Platform). You assist leadership with real-time operational analysis, compliance audits, customer complaints, food prep forecasting, and kitchen queues.

Here is the CURRENT live operations database state:
=== GLOBAL OPERATIONS OVERVIEW ===
- Total outlets: ${stats.totalOutletsCount}
- Combined revenue today: ₹${stats.totalRevenue.toLocaleString('en-IN')}
- Total orders processed: ${stats.totalOrders.toLocaleString('en-IN')}
- Global average hygiene score: ${stats.avgHygieneScore.toFixed(1)}%
- Total unresolved customer complaints: ${stats.openComplaints}
- Combined food wastage: ${stats.totalWastageKg.toFixed(1)}kg

=== OUTLET LISTINGS ===
${outletsSummary}

=== UNRESOLVED CRM COMPLAINT TICKETS ===
${ticketsSummary}

=== KITCHEN DISPLAY SYSTEM (KDS) ACTIVE QUEUE ===
${kdsSummary}

=== IoT TEMPERATURE TELEMETRY LOGS ===
${iotSummary}

=== INGREDIENT DISTRIBUTION SHIPMENTS ===
${shipmentsSummary}

=== DYNAMIC GRAPH VISUALIZATION COMMANDS ===
If the user asks to see, plot, graph, display, filter, chart, or analyze a specific metric or city visually, you MUST append a command at the very end of your response in the format:
[CMD: {"metric": "<metric_name>", "city": "<city_name>", "chartType": "<line|bar|doughnut|radar>"}]
Where:
- <metric_name> is one of: "sales", "hygiene", "wastage", "complaints", "inventory", "latency", "telemetry", "logistics"
- <city_name> is "all" or a capitalized city name (e.g. "Ahmedabad", "Surat", "Vadodara", "Bopal", "Palanpur")
- <chartType> is the best representation:
  - "line" for telemetries, latency curves, or weekly sales trends.
  - "radar" for hygiene score distributions across outlets.
  - "doughnut" for wastage contributions or categories ratios.
  - "bar" for general comparison across outlets.

Answer questions concisely, professionally, with markdown bolding and lists. Do not mention mock data.`;
  }

  function getApiKey() {
    return import.meta.env.VITE_GROQ_API_KEY || null;
  }

  async function fetchResponse(query) {
    const apiKey = getApiKey();
    if (!apiKey) {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { role: 'agent', content: `⚠️ **Configuration Error**: Groq API key is not configured in the environment. Please add \`VITE_GROQ_API_KEY\` to your \`.env\` file.` }
      ]);
      return;
    }

    const systemContext = buildSystemContext();
    const recentHistory = messages.slice(-6);

    // Prompt engineering based on selected mode
    let modeInstruction = "";
    if (copilotMode === 'graph') {
      modeInstruction = "\n[CRITICAL]: The user has activated GRAPH MODE. You MUST end your response with a [CMD: ...] command card to draw a visual chart. Keep the accompanying text to a brief 1-2 sentence summary.";
    }

    const msgPayload = [
      { role: 'system', content: systemContext + modeInstruction },
      ...recentHistory.map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: query }
    ];

    try {
      // Using ultra-fast Groq Llama 3.1 8B instant model for zero lag
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: msgPayload, temperature: 0.15 })
      });
      if (!res.ok) {
        if (res.status === 401) { throw new Error('Invalid API Key configured in `.env`. Please verify your `VITE_GROQ_API_KEY`.'); }
        throw new Error(`Server returned code ${res.status}`);
      }
      const data = await res.json();
      let answer = data?.choices?.[0]?.message?.content || 'I encountered an error receiving a response.';

      const cmdRegex = /\[CMD:\s*(\{.*?\})\s*\]/;
      const match = answer.match(cmdRegex);
      const cleanAnswer = answer.replace(cmdRegex, '').trim();

      setIsTyping(false);
      setMessages(prev => {
        const newMsgs = [...prev];
        
        // Push the agent's text response (only if not in pure graph mode, or as a small caption/explanator)
        newMsgs.push({ role: 'agent', content: cleanAnswer });

        if (match) {
          try {
            const cmdObj = JSON.parse(match[1]);
            newMsgs.push({ 
              role: 'chart', 
              metric: cmdObj.metric, 
              city: cmdObj.city, 
              chartType: cmdObj.chartType || 'bar' 
            });
          } catch (e) {}
        } else if (copilotMode === 'graph') {
          // Force a chart if none was generated in graph mode
          newMsgs.push({ role: 'chart', metric: 'sales', city: 'all', chartType: 'bar' });
        }

        localStorage.setItem(CHAT_HISTORY_LS, JSON.stringify(newMsgs));
        return newMsgs;
      });
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'agent', content: `⚠️ **LLM Connection Error**: ${err.message}` }]);
    }
  }

  function sendQuery(query) {
    if (!query.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsTyping(true);
    setTimeout(() => fetchResponse(query), 100);
  }

  function clearChat() {
    localStorage.removeItem(CHAT_HISTORY_LS);
    setMessages([{ role: 'agent', content: `Hello! I am the **Martinoz Operations Copilot**.\n\nAsk me questions or command me to plot visuals about your franchise operations.` }]);
  }

  function buildChartData(metric, city, chartType) {
    const outlets = db.getOutlets();
    const filteredOutlets = city === 'all' ? outlets : outlets.filter(o => o.city.toLowerCase() === city.toLowerCase());

    if (metric === 'inventory') {
      const skus = db.getSkus();
      const inventory = db.getInventory();
      const labels = skus.map(s => s.name);
      const stockData = skus.map(sku => inventory.filter(i => i.skuId === sku.id).reduce((s, i) => s + i.stock, 0));
      const demandData = skus.map(sku => inventory.filter(i => i.skuId === sku.id).reduce((s, i) => s + i.demand, 0));
      return { 
        labels, 
        datasets: [
          { label: 'Stock Level', data: stockData, backgroundColor: 'rgba(0, 180, 216, 0.75)', borderColor: 'rgba(0, 180, 216, 1)', borderWidth: 1, borderRadius: 4 }, 
          { label: 'Projected Demand', data: demandData, backgroundColor: 'rgba(255, 107, 53, 0.75)', borderColor: 'rgba(255, 107, 53, 1)', borderWidth: 1, borderRadius: 4 }
        ] 
      };
    }

    if (metric === 'telemetry' || chartType === 'line') {
      // Output a continuous line trend
      const labels = filteredOutlets.map(o => o.name);
      const colors = METRIC_COLORS[metric] || METRIC_COLORS.sales;
      const dataValues = filteredOutlets.map(o => {
        if (metric === 'sales') return o.sales;
        if (metric === 'hygiene') return o.hygieneScore;
        if (metric === 'telemetry') { const t = db.getIot().find(x => x.outletId === o.id); return t ? t.fridgeTemp : 3.2; }
        return o.wastageKg;
      });

      return {
        labels,
        datasets: [{
          label: METRIC_TITLES[metric],
          data: dataValues,
          borderColor: colors.border,
          backgroundColor: 'rgba(0, 180, 216, 0.15)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: colors.border,
          pointBorderColor: '#fff',
        }]
      };
    }

    if (chartType === 'doughnut') {
      // Represent proportional contributions
      const topOutlets = [...filteredOutlets].sort((a, b) => b.wastageKg - a.wastageKg).slice(0, 5);
      return {
        labels: topOutlets.map(o => o.name),
        datasets: [{
          data: topOutlets.map(o => o.wastageKg),
          backgroundColor: METRIC_COLORS.wastage.bg,
          borderColor: METRIC_COLORS.wastage.border,
          borderWidth: 1
        }]
      };
    }

    if (chartType === 'radar') {
      // Comparison across dimensions
      const topOutlets = [...filteredOutlets].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6);
      return {
        labels: topOutlets.map(o => o.name),
        datasets: [{
          label: 'Compliance Score (%)',
          data: topOutlets.map(o => o.hygieneScore),
          backgroundColor: 'rgba(56, 176, 0, 0.2)',
          borderColor: '#38b000',
          borderWidth: 2,
          pointBackgroundColor: '#38b000',
          pointBorderColor: '#fff',
        }]
      };
    }

    // Default bar chart
    const getVal = (o) => {
      if (metric === 'sales') return o.sales;
      if (metric === 'hygiene') return o.hygieneScore;
      if (metric === 'wastage') return o.wastageKg;
      if (metric === 'complaints') return o.openComplaints;
      return 0;
    };

    const colors = METRIC_COLORS[metric] || METRIC_COLORS.sales;
    return {
      labels: filteredOutlets.map(o => o.name),
      datasets: [{ label: METRIC_TITLES[metric], data: filteredOutlets.map(getVal), backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, borderRadius: 4 }]
    };
  }

  const chartOptions = (isInventory, type) => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: isInventory ? 'x' : (type === 'line' ? 'x' : 'y'),
    plugins: {
      legend: { display: isInventory, labels: { color: '#9ea8b6', font: { family: 'Inter', size: 9 } } },
      tooltip: { backgroundColor: '#0c0e12', titleFont: { family: 'Outfit', size: 11 }, bodyFont: { family: 'Inter', size: 11 }, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9ea8b6', font: { size: 9 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#f8f9fa', font: { size: 9 } } }
    }
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#9ea8b6', font: { family: 'Inter', size: 9 } } },
      tooltip: { backgroundColor: '#0c0e12', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0c0e12', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.06)' },
        grid: { color: 'rgba(255,255,255,0.06)' },
        pointLabels: { color: '#9ea8b6', font: { family: 'Inter', size: 9 } },
        ticks: { color: '#9ea8b6', backdropColor: 'transparent', font: { size: 8 } }
      }
    }
  };

  const renderChart = (metric, city, chartType) => {
    const data = buildChartData(metric, city, chartType);
    const isInventory = metric === 'inventory';

    switch (chartType) {
      case 'line':
        return <Line data={data} options={chartOptions(isInventory, 'line')} />;
      case 'doughnut':
        return <Doughnut data={data} options={doughnutOptions} />;
      case 'radar':
        return <Radar data={data} options={radarOptions} />;
      case 'bar':
      default:
        return <Bar data={data} options={chartOptions(isInventory, 'bar')} />;
    }
  };

  return (
    <>
      <TopHeader title="AI Copilot Control Room" />
      <section className="content-body copilot-body">
        <div className="notebook-container">
          <div className="notebook-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="notebook-header-title">
              <i className="fa-solid fa-wand-magic-sparkles highlight-orange" style={{ fontSize: '18px' }}></i>
              <div>
                <h3>AI Operations Assistant</h3>
                <span className="status-badge"><span className="status-dot"></span> BI Analytics Engine Connected</span>
              </div>
            </div>

            {/* Balanced Mode vs Graph Mode Switch */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{
                display: 'inline-flex',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '3px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                <button 
                  className={`btn-notebook-mode ${copilotMode === 'both' ? 'active' : ''}`}
                  onClick={() => setCopilotMode('both')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: copilotMode === 'both' ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    color: copilotMode === 'both' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all 0.2s'
                  }}
                >
                  💬 Balanced
                </button>
                <button 
                  className={`btn-notebook-mode ${copilotMode === 'graph' ? 'active' : ''}`}
                  onClick={() => setCopilotMode('graph')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: copilotMode === 'graph' ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    color: copilotMode === 'graph' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all 0.2s'
                  }}
                >
                  📊 Graph Focus
                </button>
              </div>
              <button className="btn-outline-sm" onClick={clearChat} style={{ margin: 0, height: '28px', padding: '2px 8px', fontSize: '11px' }}>
                <i className="fa-solid fa-trash-can"></i> Clear
              </button>
            </div>
          </div>

          <div className="notebook-messages-feed" ref={feedRef}>
            {messages.map((msg, i) => {
              if (msg.role === 'chart') {
                return (
                  <div key={i} className="chat-bubble agent inline-chart-card" style={{ maxWidth: '100%' }}>
                    <div className="inline-chart-header">
                      <h4>
                        <i className="fa-solid fa-chart-column highlight-orange"></i> {METRIC_TITLES[msg.metric] || 'Franchise Metrics'} - {msg.city === 'all' ? 'All Territories' : msg.city}
                      </h4>
                      <span className="badge badge-info" style={{ fontSize: '8px', textTransform: 'uppercase' }}>
                        {msg.chartType || 'bar'} chart
                      </span>
                    </div>
                    <div className="inline-chart-wrapper" style={{ height: '240px', position: 'relative' }}>
                      {renderChart(msg.metric, msg.city, msg.chartType)}
                    </div>
                  </div>
                );
              }

              // Text bubble handling
              const isGraphFocusMessage = copilotMode === 'graph' && msg.role === 'agent';
              return (
                <div 
                  key={i} 
                  className={`chat-bubble ${msg.role}`} 
                  style={{
                    // Shrink details if in graph mode to focus purely on visual output
                    opacity: isGraphFocusMessage ? 0.75 : 1,
                    fontSize: isGraphFocusMessage ? '12px' : '13px',
                    borderLeft: isGraphFocusMessage ? '2px solid var(--primary)' : 'none'
                  }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} 
                />
              );
            })}
            {isTyping && (
              <div className="chat-bubble agent">
                <div className="typing-bubble">
                  <div className="dot-typing"></div>
                  <div className="dot-typing"></div>
                  <div className="dot-typing"></div>
                </div>
              </div>
            )}
          </div>

          <div className="notebook-input-panel">
            <div className="suggestions-label">Operational Shortcuts</div>
            <div className="suggestions-row">
              {SUGGESTIONS.map(s => (
                <button key={s.label} className="suggestion-pill" onClick={() => sendQuery(s.query)}>{s.label}</button>
              ))}
            </div>
            <form className="notebook-form" onSubmit={e => { e.preventDefault(); sendQuery(input); }}>
              <input type="text" className="form-control-notebook" placeholder={copilotMode === 'graph' ? "Request graph views (e.g. 'draw wastage in Surat')..." : "Ask operations questions or command charts..."} value={input} onChange={e => setInput(e.target.value)} required autoComplete="off" />
              <button type="submit" className="btn-notebook-send"><i className="fa-solid fa-paper-plane"></i></button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
