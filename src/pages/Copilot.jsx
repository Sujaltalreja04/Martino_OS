import { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GROQ_KEY_LS = 'martinoz_groq_api_key';
const CHAT_HISTORY_LS = 'martinoz_fip_copilot_chat';

const METRIC_TITLES = {
  sales: 'Sales Performance (₹)', hygiene: 'Hygiene Compliance (%)', wastage: 'Food Wastage (kg)',
  complaints: 'Active CRM Complaints', inventory: 'Stock vs Demand Alignment',
  latency: 'Kitchen Prep Latency (mins)', telemetry: 'IoT Cold Store Telemetry (°C)',
  logistics: 'Ingredient Distribution Shipments (%)',
};
const METRIC_COLORS = {
  sales: { bg: 'rgba(255, 107, 53, 0.75)', border: 'rgba(255, 107, 53, 1)' },
  hygiene: { bg: 'rgba(56, 176, 0, 0.75)', border: 'rgba(56, 176, 0, 1)' },
  wastage: { bg: 'rgba(255, 183, 3, 0.75)', border: 'rgba(255, 183, 3, 1)' },
  complaints: { bg: 'rgba(217, 4, 41, 0.75)', border: 'rgba(217, 4, 41, 1)' },
  latency: { bg: 'rgba(255, 183, 3, 0.75)', border: 'rgba(255, 183, 3, 1)' },
  telemetry: { bg: 'rgba(0, 180, 216, 0.75)', border: 'rgba(0, 180, 216, 1)' },
  logistics: { bg: 'rgba(56, 176, 0, 0.75)', border: 'rgba(56, 176, 0, 1)' },
  inventory: { bg: 'rgba(255, 107, 53, 0.75)', border: 'rgba(255, 107, 53, 1)' },
};

const SUGGESTIONS = [
  { label: '📊 Plot All Sales', query: 'Draw a chart of sales performance across all outlets' },
  { label: '🛡️ Plot Hygiene Scores', query: 'Show me compliance hygiene ratings for all cities' },
  { label: '🥖 Ahmedabad Wastage Chart', query: 'Plot a wastage graph for Ahmedabad locations' },
  { label: '📈 Bopal Prep', query: "What is Bopal Crossroad's prep forecast?" },
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
      `- ${o.id}: ${o.name} (${o.city}) | Manager: ${o.manager} | Sales: ₹${o.sales} | Orders: ${o.orders} | Hygiene: ${o.hygieneScore}% | Tickets: ${o.openComplaints} | Wastage: ${o.wastageKg.toFixed(1)}kg | Risk: ${o.alertStatus}`
    ).join('\n');
    const ticketsSummary = tickets.map(t =>
      `- ${t.id}: ${t.outletName} (${t.outletId}) | Category: ${t.category} | Urgency: ${t.priority} | SLA: ${t.slaHours}h | Desc: "${t.description}"`
    ).join('\n');
    const inventoryMismatches = [];
    inventory.forEach(item => {
      const diff = item.stock - item.demand;
      if (diff !== 0) {
        const sku = skus.find(s => s.id === item.skuId);
        const skuName = sku ? sku.name : 'Unknown Product';
        const type = diff < 0 ? 'Stockout Risk (Low Stock)' : 'Overstock Risk (Excess Stock)';
        inventoryMismatches.push(`  * ${item.outletId} (${outlets.find(o => o.id === item.outletId)?.name}): ${skuName} | Stock: ${item.stock} vs Demand: ${item.demand} | Status: ${type}`);
      }
    });
    const kdsSummary = kds.map(o => `- Order ${o.id} (${outlets.find(ou => ou.id === o.outletId)?.name}): Customer: ${o.customerName} | Status: ${o.status} | Prep Time: ${o.prepTimeMinutes}m`).join('\n');
    const iotSummary = iot.map(t => `- ${outlets.find(ou => ou.id === t.outletId)?.name} (${t.outletId}): Fridge Temp: ${t.fridgeTemp}°C | Oven Temp: ${t.ovenTemp}°C`).join('\n');
    const shipmentsSummary = shipments.map(s => `- Ship ${s.id} to ${s.destination}: Status: ${s.status} | Progress: ${s.progress}%`).join('\n');
    const promosSummary = promos.map(p => `- Promo Code ${p.code}: Disc: ${p.discount}% | Status: ${p.status}`).join('\n');

    return `You are the operations AI Copilot for Martinoz Pizza Corporate Headquarters (FIP Platform). You assist leadership with real-time operational analysis, compliance audits, customer complaints, food prep forecasting, and kitchen queues.

Here is the CURRENT live operations database state:
=== GLOBAL OPERATIONS OVERVIEW ===
- Total outlets: ${stats.totalOutletsCount}
- Combined revenue today: ₹${stats.totalRevenue.toLocaleString('en-IN')}
- Total orders processed: ${stats.totalOrders.toLocaleString('en-IN')}
- Global average hygiene score: ${stats.avgHygieneScore.toFixed(1)}%
- Total unresolved customer complaints: ${stats.openComplaints}
- Warning flagged outlets count: ${stats.warningOutletsCount}
- Critical risk outlets count: ${stats.criticalOutletsCount}
- Combined food wastage: ${stats.totalWastageKg.toFixed(1)}kg

=== SKU INVENTORY & STOCK ALIGNMENT ===
- Total lost sales risk (Stockouts): ₹${statsInv.totalLostSales.toLocaleString('en-IN')}
- Total wastage risk (Overstock): ₹${statsInv.totalWastageVal.toLocaleString('en-IN')}
- Current stock alignment score: ${statsInv.alignmentScore}%
- Mismatch alerts count: ${statsInv.totalAlerts}

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

=== ACTIVE MARKETING PROMOTION CAMPAIGNS ===
${promosSummary}

=== DYNAMIC GRAPH VISUALIZATION COMMANDS ===
If the user asks to see, plot, graph, display, filter, chart, or analyze a specific metric or city visually, you MUST append a command at the very end of your response in the format:
[CMD: {"metric": "<metric_name>", "city": "<city_name>"}]
Where <metric_name> must be one of: "sales", "hygiene", "wastage", "complaints", "inventory", "latency", "telemetry", "logistics"
And <city_name> must be "all" or a capitalized city name (e.g. "Ahmedabad", "Surat", "Vadodara", "Bopal", "Palanpur")

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
    const msgPayload = [
      { role: 'system', content: systemContext },
      ...recentHistory.map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: query }
    ];

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'meta-llama/llama-4-scout-17b-16e-instruct', messages: msgPayload, temperature: 0.2 })
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
        const newMsgs = [...prev, { role: 'agent', content: cleanAnswer }];
        if (match) {
          try {
            const cmdObj = JSON.parse(match[1]);
            newMsgs.push({ role: 'chart', metric: cmdObj.metric, city: cmdObj.city });
          } catch (e) {}
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



  function buildChartData(metric, city) {
    const outlets = db.getOutlets();
    const filteredOutlets = city === 'all' ? outlets : outlets.filter(o => o.city.toLowerCase() === city.toLowerCase());

    if (metric === 'inventory') {
      const skus = db.getSkus();
      const inventory = db.getInventory();
      const filteredInv = city === 'all' ? inventory : inventory.filter(item => {
        const outlet = outlets.find(o => o.id === item.outletId);
        return outlet && outlet.city.toLowerCase() === city.toLowerCase();
      });
      const labels = skus.map(s => s.name);
      const stockData = skus.map(sku => filteredInv.filter(i => i.skuId === sku.id).reduce((s, i) => s + i.stock, 0));
      const demandData = skus.map(sku => filteredInv.filter(i => i.skuId === sku.id).reduce((s, i) => s + i.demand, 0));
      return { labels, datasets: [{ label: 'Stock Level', data: stockData, backgroundColor: 'rgba(0, 180, 216, 0.75)', borderColor: 'rgba(0, 180, 216, 1)', borderWidth: 1, borderRadius: 4 }, { label: 'Projected Demand', data: demandData, backgroundColor: 'rgba(255, 107, 53, 0.75)', borderColor: 'rgba(255, 107, 53, 1)', borderWidth: 1, borderRadius: 4 }] };
    }

    if (metric === 'logistics') {
      const shipments = db.getShipments();
      const colors = METRIC_COLORS.logistics;
      return { labels: shipments.map(s => `${s.id}`), datasets: [{ label: 'Transit Progress', data: shipments.map(s => s.progress), backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, borderRadius: 4 }] };
    }

    const getVal = (o) => {
      if (metric === 'sales') return o.sales;
      if (metric === 'hygiene') return o.hygieneScore;
      if (metric === 'wastage') return o.wastageKg;
      if (metric === 'complaints') return o.openComplaints;
      if (metric === 'latency') { const orders = db.getKds().filter(ord => ord.outletId === o.id); return orders.length > 0 ? Math.round(orders.reduce((s, x) => s + x.prepTimeMinutes, 0) / orders.length) : 12; }
      if (metric === 'telemetry') { const entry = db.getIot().find(t => t.outletId === o.id); return entry ? entry.fridgeTemp : 3.0; }
      return 0;
    };

    const colors = METRIC_COLORS[metric] || METRIC_COLORS.sales;
    return {
      labels: filteredOutlets.map(o => o.name),
      datasets: [{ label: METRIC_TITLES[metric], data: filteredOutlets.map(getVal), backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, borderRadius: 4 }]
    };
  }

  const chartOptions = (isInventory) => ({
    responsive: true, maintainAspectRatio: false,
    indexAxis: isInventory ? 'x' : 'y',
    plugins: {
      legend: { display: isInventory, labels: { color: '#9ea8b6', font: { family: 'Inter', size: 9 } } },
      tooltip: { backgroundColor: '#0c0e12', titleFont: { family: 'Outfit', size: 11 }, bodyFont: { family: 'Inter', size: 11 }, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }
    },
    scales: {
      x: { grid: isInventory ? { color: 'rgba(255,255,255,0.04)' } : { display: false }, ticks: { color: '#9ea8b6', font: { size: 9 } } },
      y: { grid: isInventory ? { display: false } : { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#f8f9fa', font: { size: 9 } } }
    }
  });

  return (
    <>
      <TopHeader title="AI Copilot Control Room" />
      <section className="content-body copilot-body">
        <div className="notebook-container">
          <div className="notebook-header">
            <div className="notebook-header-title">
              <i className="fa-solid fa-wand-magic-sparkles highlight-orange" style={{ fontSize: '18px' }}></i>
              <div>
                <h3>AI Operations Assistant</h3>
                <span className="status-badge"><span className="status-dot"></span> BI Analytics Engine Connected</span>
              </div>
            </div>
            <button className="btn-outline-sm" onClick={clearChat}><i className="fa-solid fa-trash-can"></i> Clear Conversation</button>
          </div>

          <div className="notebook-messages-feed" ref={feedRef}>
            {messages.map((msg, i) => {
              if (msg.role === 'chart') {
                const chartData = buildChartData(msg.metric, msg.city);
                const isInventory = msg.metric === 'inventory';
                return (
                  <div key={i} className="chat-bubble agent inline-chart-card">
                    <div className="inline-chart-header">
                      <h4><i className="fa-solid fa-chart-column highlight-orange"></i> {METRIC_TITLES[msg.metric] || 'Franchise Metrics'} - {msg.city === 'all' ? 'All Territories' : msg.city}</h4>
                      <span className="badge badge-info" style={{ fontSize: '8px' }}>BI Analytics Card</span>
                    </div>
                    <div className="inline-chart-wrapper">
                      <Bar data={chartData} options={chartOptions(isInventory)} />
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className={`chat-bubble ${msg.role}`} dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
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
              <input type="text" className="form-control-notebook" placeholder="Ask operations questions or command charts (e.g. 'draw wastage in Surat')..." value={input} onChange={e => setInput(e.target.value)} required autoComplete="off" />
              <button type="submit" className="btn-notebook-send"><i className="fa-solid fa-paper-plane"></i></button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
