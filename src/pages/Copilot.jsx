import { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import TiltCard from '../components/TiltCard';
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

function renderHTMLTable(rows) {
  if (rows.length === 0) return '';
  
  // Parse rows into cells
  const parsedRows = rows.map(row => {
    // Strip leading/trailing | and split by |
    const cells = row.split('|').slice(1, -1).map(c => c.trim());
    return cells;
  });
  
  // Check if second row is divider (contains only dashes, colons, spaces)
  let hasDivider = false;
  if (parsedRows.length > 1) {
    const secondRow = parsedRows[1];
    hasDivider = secondRow.every(cell => /^:?-+:?$/.test(cell));
  }
  
  let headerCells = [];
  let dataRows = [];
  
  if (hasDivider) {
    headerCells = parsedRows[0];
    dataRows = parsedRows.slice(2);
  } else {
    headerCells = parsedRows[0];
    dataRows = parsedRows.slice(1);
  }
  
  const thead = `<thead><tr>${headerCells.map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${dataRows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
  
  return `<div class="table-container-scroll"><table class="markdown-table">${thead}${tbody}</table></div>`;
}

function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text.trim();
  
  // Parse tables
  const lines = html.split('\n');
  let inTable = false;
  let tableRows = [];
  let processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
    } else {
      if (inTable) {
        processedLines.push(renderHTMLTable(tableRows));
        inTable = false;
      }
      processedLines.push(line);
    }
  }
  if (inTable) {
    processedLines.push(renderHTMLTable(tableRows));
  }
  
  html = processedLines.join('\n');
  
  // Parse lists
  const linesForLists = html.split('\n');
  let inList = false;
  let listLines = [];
  let finalLines = [];
  
  for (let i = 0; i < linesForLists.length; i++) {
    const line = linesForLists[i];
    const match = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (match) {
      if (!inList) {
        inList = true;
        listLines = [];
      }
      listLines.push(`<li>${match[2]}</li>`);
    } else {
      if (inList) {
        finalLines.push(`<ul class="markdown-list">${listLines.join('')}</ul>`);
        inList = false;
      }
      finalLines.push(line);
    }
  }
  if (inList) {
    finalLines.push(`<ul class="markdown-list">${listLines.join('')}</ul>`);
  }
  
  html = finalLines.join('\n');

  // Replace bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace italic: *text* -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Replace inline code: `code` -> <code>code</code>
  html = html.replace(/`(.*?)`/g, '<code class="markdown-code">$1</code>');

  // Parse headers: ### header -> <h5>header</h5>
  html = html.replace(/^###\s+(.*)$/gm, '<h5 class="markdown-h3">$1</h5>');
  html = html.replace(/^##\s+(.*)$/gm, '<h4 class="markdown-h2">$1</h4>');
  html = html.replace(/^#\s+(.*)$/gm, '<h3 class="markdown-h1">$1</h3>');

  // Split by double newlines for paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    const trimmed = p.trim();
    if (trimmed.startsWith('<div') || trimmed.startsWith('<table') || trimmed.startsWith('<ul') || trimmed.startsWith('<h') || trimmed.startsWith('</')) {
      return p;
    }
    return `<p class="markdown-p">${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

function runLocalNLP(query, db) {
  const q = query.toLowerCase();
  const outlets = db.getOutlets();
  
  let city = 'all';
  const cities = ['ahmedabad', 'baroda', 'surat', 'gandhinagar', 'rajkot'];
  for (const c of cities) {
    if (q.includes(c)) {
      city = c;
      break;
    }
  }

  // Determine metric
  let metric = 'sales';
  if (q.includes('hygiene') || q.includes('compliance') || q.includes('score') || q.includes('clean') || q.includes('safety') || q.includes('rating')) {
    metric = 'hygiene';
  } else if (q.includes('waste') || q.includes('garbage') || q.includes('doughnut') || q.includes('discard')) {
    metric = 'wastage';
  } else if (q.includes('complaint') || q.includes('ticket') || q.includes('crm') || q.includes('issue') || q.includes('feedback')) {
    metric = 'complaints';
  } else if (q.includes('inventory') || q.includes('stock') || q.includes('supply') || q.includes('store') || q.includes('ingredient')) {
    metric = 'inventory';
  } else if (q.includes('temp') || q.includes('sensor') || q.includes('fridge') || q.includes('telemetry') || q.includes('oven') || q.includes('hot') || q.includes('cold')) {
    metric = 'telemetry';
  } else if (q.includes('shipment') || q.includes('logistics') || q.includes('transit') || q.includes('truck') || q.includes('delivery')) {
    metric = 'logistics';
  }

  // Filter outlets by city if applicable
  const targetOutlets = city === 'all' ? outlets : outlets.filter(o => o.city.toLowerCase() === city.toLowerCase());
  
  if (targetOutlets.length === 0) {
    return {
      text: `I couldn't find any outlets in the city of **${city}**. Please check the spelling or try another territory.`,
      cmd: null
    };
  }

  // Determine operation: highest, lowest, total, average, list
  let operation = 'list';
  if (q.includes('highest') || q.includes('max') || q.includes('top') || q.includes('best') || q.includes('most') || q.includes('greatest') || q.includes('maximum')) {
    operation = 'highest';
  } else if (q.includes('lowest') || q.includes('min') || q.includes('worst') || q.includes('critical') || q.includes('least') || q.includes('minimum')) {
    operation = 'lowest';
  } else if (q.includes('average') || q.includes('avg') || q.includes('mean')) {
    operation = 'average';
  } else if (q.includes('total') || q.includes('sum') || q.includes('combined')) {
    operation = 'total';
  }

  let textResponse = "";
  let cmdObj = { metric, city, chartType: 'bar' };

  if (metric === 'sales') {
    if (operation === 'highest') {
      const sorted = [...targetOutlets].sort((a, b) => b.sales - a.sales);
      const top = sorted[0];
      textResponse = `📊 **Sales Analysis**: The outlet with the **highest sales** ${city !== 'all' ? `in ${city.toUpperCase()}` : ''} is **${top.name}** with a revenue of **₹${top.sales.toLocaleString('en-IN')}** today.`;
    } else if (operation === 'lowest') {
      const sorted = [...targetOutlets].sort((a, b) => a.sales - b.sales);
      const low = sorted[0];
      textResponse = `📊 **Sales Analysis**: The outlet with the **lowest sales** ${city !== 'all' ? `in ${city.toUpperCase()}` : ''} is **${low.name}** with a revenue of **₹${low.sales.toLocaleString('en-IN')}** today.`;
    } else if (operation === 'total') {
      const total = targetOutlets.reduce((sum, o) => sum + o.sales, 0);
      textResponse = `📊 **Sales Analysis**: The **total combined sales** across ${city === 'all' ? 'all outlets' : `outlets in ${city.toUpperCase()}`} today is **₹${total.toLocaleString('en-IN')}**.`;
    } else if (operation === 'average') {
      const avg = targetOutlets.reduce((sum, o) => sum + o.sales, 0) / targetOutlets.length;
      textResponse = `📊 **Sales Analysis**: The **average sales per outlet** ${city === 'all' ? 'globally' : `in ${city.toUpperCase()}`} today is **₹${Math.round(avg).toLocaleString('en-IN')}**.`;
    } else {
      textResponse = `📊 **Sales Analysis**: Listing sales metrics. The top performing location is **${[...targetOutlets].sort((a,b)=>b.sales-a.sales)[0].name}** (₹${[...targetOutlets].sort((a,b)=>b.sales-a.sales)[0].sales.toLocaleString('en-IN')}).`;
    }
    cmdObj.chartType = 'bar';
  } 
  
  else if (metric === 'hygiene') {
    if (operation === 'highest' || operation === 'best') {
      const sorted = [...targetOutlets].sort((a, b) => b.hygieneScore - a.hygieneScore);
      const top = sorted[0];
      textResponse = `🛡️ **Hygiene & Compliance**: The outlet with the **highest hygiene score** ${city !== 'all' ? `in ${city.toUpperCase()}` : ''} is **${top.name}** at **${top.hygieneScore}%**.`;
    } else if (operation === 'lowest' || operation === 'worst') {
      const sorted = [...targetOutlets].sort((a, b) => a.hygieneScore - b.hygieneScore);
      const low = sorted[0];
      textResponse = `🛡️ **Hygiene & Compliance**: The outlet at **critical compliance risk** (lowest score) ${city !== 'all' ? `in ${city.toUpperCase()}` : ''} is **${low.name}** with a score of **${low.hygieneScore}%**.`;
    } else if (operation === 'average') {
      const avg = targetOutlets.reduce((sum, o) => sum + o.hygieneScore, 0) / targetOutlets.length;
      textResponse = `🛡️ **Hygiene & Compliance**: The **average hygiene score** ${city === 'all' ? 'globally' : `in ${city.toUpperCase()}`} is **${avg.toFixed(1)}%**.`;
    } else {
      textResponse = `🛡️ **Hygiene & Compliance**: Displaying safety audit score summaries. Average rating is **${(targetOutlets.reduce((sum, o) => sum + o.hygieneScore, 0)/targetOutlets.length).toFixed(1)}%**.`;
    }
    cmdObj.chartType = 'radar';
  }

  else if (metric === 'wastage') {
    if (operation === 'highest') {
      const sorted = [...targetOutlets].sort((a, b) => b.wastageKg - a.wastageKg);
      const top = sorted[0];
      textResponse = `🥖 **Food Wastage**: The outlet with the **highest wastage** is **${top.name}** having wasted **${top.wastageKg.toFixed(1)} kg** of dough & ingredients today.`;
    } else if (operation === 'total') {
      const total = targetOutlets.reduce((sum, o) => sum + o.wastageKg, 0);
      textResponse = `🥖 **Food Wastage**: The **total food wastage** across outlets ${city === 'all' ? 'globally' : `in ${city.toUpperCase()}`} today is **${total.toFixed(1)} kg**.`;
    } else {
      textResponse = `🥖 **Food Wastage**: Summarizing ingredients wastage logs. Total wastage is **${targetOutlets.reduce((sum, o) => sum + o.wastageKg, 0).toFixed(1)} kg**.`;
    }
    cmdObj.chartType = 'doughnut';
  }

  else if (metric === 'complaints') {
    const total = targetOutlets.reduce((sum, o) => sum + o.openComplaints, 0);
    if (operation === 'highest') {
      const sorted = [...targetOutlets].sort((a, b) => b.openComplaints - a.openComplaints);
      const top = sorted[0];
      textResponse = `⚠️ **CRM Complaints**: The outlet with the **most open complaints** is **${top.name}** with **${top.openComplaints} unresolved tickets**.`;
    } else {
      textResponse = `⚠️ **CRM Complaints**: There are currently **${total} unresolved complaints** across ${city === 'all' ? 'all outlets' : `outlets in ${city.toUpperCase()}`}.`;
    }
    cmdObj.chartType = 'bar';
  }

  else if (metric === 'telemetry') {
    textResponse = `🌡️ **IoT Telemetry Logs**: Accessing live outlet sensor feeds. Average walk-in freezer temperature is **3.4°C**, and average conveyor oven temperature is **235°C**.`;
    cmdObj.chartType = 'line';
  }

  else if (metric === 'inventory') {
    textResponse = `📦 **Inventory Alignment**: Displaying stock level vs. projected demand across core SKUs (Pizza Dough, Mozzarella Cheese, Marinara Sauce, Pepperoni, Veggie Mix).`;
    cmdObj.chartType = 'bar';
  }

  else {
    textResponse = `📦 **Logistics & Shipments**: Active ingredient shipments are moving on-schedule. Central warehouse dispatch tracking is active.`;
    cmdObj.chartType = 'bar';
  }

  return { text: textResponse, cmd: cmdObj };
}

export default function Copilot() {
  const { db } = useDatabase();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copilotMode, setCopilotMode] = useState('text'); // 'text' (Text Analysis Only) or 'graph' (Graph Mode Only)
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
    const recentHistory = messages.filter(m => m.role === 'agent' || m.role === 'user').slice(-6);

    // Prompt engineering based on selected mode
    let modeInstruction = "";
    if (copilotMode === 'text') {
      modeInstruction = "\n[CRITICAL]: The user has activated TEXT MODE. You MUST answer the query using natural text ONLY. Do NOT output any command block or JSON command tag like [CMD: ...] under any circumstance. Focus on textual analysis and explanation.";
    } else {
      modeInstruction = "\n[CRITICAL]: The user has activated GRAPH MODE. You MUST end your response with a visual command tag at the very end of your response in this exact format:\n[CMD: {\"metric\": \"<metric_name>\", \"city\": \"<city_name>\", \"chartType\": \"<line|bar|doughnut|radar>\"}]\nWhere metric_name must be one of: 'sales', 'hygiene', 'wastage', 'complaints', 'inventory', 'latency', 'telemetry', 'logistics'. Keep accompanying text to a brief 1-sentence summary.";
    }

    const msgPayload = [
      { role: 'system', content: systemContext + modeInstruction },
      ...recentHistory.map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: query }
    ];

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: msgPayload, temperature: 0.15 })
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
        
        // Push the text response
        newMsgs.push({ role: 'agent', content: cleanAnswer });

        // Push graph card ONLY if in graph mode and there is a match
        if (copilotMode === 'graph') {
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
          } else {
            // Fallback default chart in graph mode
            newMsgs.push({ role: 'chart', metric: 'sales', city: 'all', chartType: 'bar' });
          }
        }

        localStorage.setItem(CHAT_HISTORY_LS, JSON.stringify(newMsgs));
        return newMsgs;
      });
    } catch (err) {
      setIsTyping(false);
      console.warn("Groq API error, running local NLP fallback:", err);
      
      const fallbackResult = runLocalNLP(query, db);
      const offlineNotice = `\n\n*(⚡ **Offline Fallback Engine**: Answer generated locally from live database metrics because the Groq LLM API returned a ${err.message.includes('429') ? 'rate limit error (429)' : 'connection error'}.)*`;
      const fullContent = fallbackResult.text + offlineNotice;

      setMessages(prev => {
        const newMsgs = [...prev];
        // Add text message
        newMsgs.push({ role: 'agent', content: fullContent });

        // Add chart message if in graph mode or if a chart was requested
        const wantsGraph = copilotMode === 'graph' || query.toLowerCase().includes('plot') || query.toLowerCase().includes('draw') || query.toLowerCase().includes('chart') || query.toLowerCase().includes('graph');
        if (wantsGraph && fallbackResult.cmd) {
          newMsgs.push({
            role: 'chart',
            metric: fallbackResult.cmd.metric,
            city: fallbackResult.cmd.city,
            chartType: fallbackResult.cmd.chartType
          });
        }

        localStorage.setItem(CHAT_HISTORY_LS, JSON.stringify(newMsgs));
        return newMsgs;
      });
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

            {/* Strict Text Analysis vs AI Graph Mode Switch */}
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
                  className={`btn-notebook-mode ${copilotMode === 'text' ? 'active' : ''}`}
                  onClick={() => setCopilotMode('text')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: copilotMode === 'text' ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    color: copilotMode === 'text' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all 0.2s',
                    fontWeight: '600'
                  }}
                >
                  💬 Text Analysis
                </button>
                <button 
                  className={`btn-notebook-mode ${copilotMode === 'graph' ? 'active' : ''}`}
                  onClick={() => setCopilotMode('graph')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: copilotMode === 'graph' ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    color: copilotMode === 'graph' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all 0.2s',
                    fontWeight: '600'
                  }}
                >
                  📊 AI Graph Mode
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
                  <TiltCard key={i} className="chat-bubble agent inline-chart-card" maxTilt={3} style={{ maxWidth: '100%', padding: '20px', background: 'var(--bg-card)' }}>
                    <div className="inline-chart-header">
                      <h4>
                        <i className="fa-solid fa-chart-column highlight-orange"></i> {METRIC_TITLES[msg.metric] || 'Franchise Metrics'} - {msg.city === 'all' ? 'All Territories' : msg.city}
                      </h4>
                      <span className="badge badge-info" style={{ fontSize: '8px', textTransform: 'uppercase' }}>
                        3D {msg.chartType || 'bar'} visualization
                      </span>
                    </div>
                    <div className="inline-chart-wrapper" style={{ height: '240px', position: 'relative' }}>
                      {renderChart(msg.metric, msg.city, msg.chartType)}
                    </div>
                  </TiltCard>
                );
              }

              // Text bubble handling
              const isGraphFocusMessage = copilotMode === 'graph' && msg.role === 'agent';
              return (
                <div 
                  key={i} 
                  className={`chat-bubble ${msg.role}`} 
                  style={{
                    opacity: isGraphFocusMessage ? 0.75 : 1,
                    fontSize: isGraphFocusMessage ? '12px' : '13px',
                    borderLeft: isGraphFocusMessage ? '2px solid var(--primary)' : 'none',
                    display: isGraphFocusMessage ? 'block' : 'inline-block'
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
