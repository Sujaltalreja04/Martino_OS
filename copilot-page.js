/* ==========================================================================
   Martinoz Franchise Intelligence Platform - Conversational BI Notebook
   Controls full-width chat interface with inline dynamic Chart.js visuals.
   ========================================================================== */

(function() {
  'use strict';

  // Make sure database is loaded
  if (typeof Database === 'undefined') {
    console.error("Database mock layer (data.js) is missing!");
    return;
  }

  // --- Constants ---
  const LOCAL_STORAGE_CHAT_KEY = 'martinoz_fip_copilot_chat';

  // --- Elements ---
  const chatMessagesContainer = document.getElementById('page-chat-messages-container');
  const chatInputForm = document.getElementById('page-chat-input-form');
  const chatInput = document.getElementById('page-chat-input');
  const clearChatBtn = document.getElementById('btn-clear-chat-page');
  const suggestionsRow = document.getElementById('suggestions-row-container');

  // --- Global State ---
  let chatHistory = [];

  // ==========================================================================
  // PART 1: CORE NOTEBOOK & DIALOGUE CONTROLLER
  // ==========================================================================

  function initNotebook() {
    // Event listeners
    chatInputForm.addEventListener('submit', handleChatSubmit);
    clearChatBtn.addEventListener('click', clearChatHistory);
    
    // Suggestion pills click
    suggestionsRow.addEventListener('click', (e) => {
      const pill = e.target.closest('.suggestion-pill');
      if (pill) {
        const query = pill.getAttribute('data-query');
        if (query) {
          sendUserQuery(query);
        }
      }
    });

    // Load Chat History
    const saved = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
    if (saved) {
      chatHistory = JSON.parse(saved);
      renderChatHistory();
    } else {
      renderWelcomeMessage();
    }
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    sendUserQuery(text);
  }

  function sendUserQuery(text) {
    // Append User message
    appendMessageBubble('user', text);
    chatHistory.push({ role: 'user', content: text });
    saveChatHistory();

    // Append Typing Indicator
    const typingIndicator = appendTypingIndicator();

    // Call API proxy
    fetchCopilotResponse(typingIndicator);
  }

  function appendMessageBubble(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    
    // Render simple markdown elements (bold, line breaks, list items)
    let parsedText = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\* (.*?)(<br>|$)/g, '<li>$1</li>');

    if (parsedText.includes('<li>')) {
      parsedText = parsedText
        .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
        .replace(/<\/ul><br><ul>/g, '')
        .replace(/<\/ul><ul>/g, '');
    }

    bubble.innerHTML = parsedText;
    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function appendTypingIndicator() {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble agent';
    bubble.id = 'copilot-typing-indicator';
    bubble.innerHTML = `
      <div class="typing-bubble">
        <div class="dot-typing"></div>
        <div class="dot-typing"></div>
        <div class="dot-typing"></div>
      </div>
    `;
    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    return bubble;
  }

  function renderWelcomeMessage() {
    chatMessagesContainer.innerHTML = '';
    const welcome = `Hello! I am the **Martinoz Operations Copilot**.<br><br>
I have direct access to our real-time sales registry, customer complaints CRM, and food safety checklists.<br><br>
Ask me questions or command me to plot visuals:<br>
* **"Plot a sales chart of Surat outlets"**<br>
* **"Show me the hygiene scores for Ahmedabad"**<br>
* **"Display food wastage in a bar chart for Vadodara"**<br>
* **"Which branches are at critical compliance risk?"**<br>
* **"What is Bopal Crossroad's current hygiene score?"**`;
    appendMessageBubble('agent', welcome);
  }

  function stripCmd(text) {
    const cmdRegex = /\[CMD:\s*(\{.*?\})\s*\]/;
    return text.replace(cmdRegex, '').trim();
  }

  function renderChatHistory() {
    chatMessagesContainer.innerHTML = '';
    
    chatHistory.forEach(msg => {
      // 1. Render message text
      const cleanText = stripCmd(msg.content);
      appendMessageBubble(msg.role === 'user' ? 'user' : 'agent', cleanText);

      // 2. Parse command block and render inline chart if present
      if (msg.role === 'assistant') {
        const cmdRegex = /\[CMD:\s*(\{.*?\})\s*\]/;
        const match = msg.content.match(cmdRegex);
        if (match) {
          try {
            const cmdObj = JSON.parse(match[1]);
            createInlineChartCard(cmdObj.metric, cmdObj.city);
          } catch (e) {
            console.error("History chart render error:", e);
          }
        }
      }
    });
  }

  function clearChatHistory() {
    chatHistory = [];
    localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    renderWelcomeMessage();
  }

  function saveChatHistory() {
    localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(chatHistory));
  }

  // Generate system context payload containing the actual operations data
  function generateSystemContext() {
    const stats = Database.getGlobalStats();
    const outlets = Database.getOutlets();
    const tickets = Database.getTickets().filter(t => t.status !== 'Resolved');
    const inventory = Database.getInventory();
    const skus = Database.getSkus();
    const statsInv = Database.getInventoryStats();
    const kds = Database.getKds() || [];
    const iot = Database.getIot() || [];
    const shipments = Database.getShipments() || [];
    const promos = Database.getPromos() || [];

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
        inventoryMismatches.push(`  * ${item.outletId} (${outlets.find(o => o.id === item.outletId)?.name}): ${skuName} | Stock: ${item.stock} vs Demand: ${item.demand} | Status: ${type} | Lost Sales/Wastage value impact: ₹${Math.abs(diff) * (sku ? sku.price : 0)}`);
      }
    });
    const inventorySummary = inventoryMismatches.join('\n');

    const kdsSummary = kds.map(o =>
      `- Order ${o.id} (${outlets.find(ou => ou.id === o.outletId)?.name}): Customer: ${o.customerName} | Status: ${o.status} | Prep Time: ${o.prepTimeMinutes}m | Items: "${o.items}"`
    ).join('\n');

    const iotSummary = iot.map(t =>
      `- ${outlets.find(ou => ou.id === t.outletId)?.name} (${t.outletId}): Fridge Temp: ${t.fridgeTemp}°C (Threshold: <=5°C) | Oven Temp: ${t.ovenTemp}°C (Standard: 230-250°C)`
    ).join('\n');

    const shipmentsSummary = shipments.map(s =>
      `- Ship ${s.id} to ${s.destination}: Status: ${s.status} | Cargo: ${s.cargo} | Route Progress: ${s.progress}%`
    ).join('\n');

    const promosSummary = promos.map(p =>
      `- Promo Code ${p.code}: Disc: ${p.discount}% | Desc: "${p.description}" | Status: ${p.status}`
    ).join('\n');

    return `You are the operations AI Copilot for Martinoz Pizza Corporate Headquarters (FIP Platform).
You assist the leadership with real-time operational analysis, compliance audits, customer complaints, food prep forecasting, kitchen queues (KDS), cold chain compliance (IoT temperature logger), dynamic promotions, and distribution logistics.

Here is the CURRENT live operations database state (factual metrics, do not invent numbers):
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

=== INVENTORY STOCK VS DEMAND MISMATCH RECORDS ===
${inventorySummary}

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

=== OPERATIONAL INSTRUCTIONS ===
1. If asked about sales or revenue, list totals and point out the top performer: Ahmedabad CG Road (OUT-02) with ₹6,200, followed by Ahmedabad Satellite (OUT-07) and Surat Varachha.
2. If asked about compliance, hygiene, or FSSAI threats, flag that Bopal Crossroad (OUT-05) has a critical compliance rating of 65% (5 complaints) and Palanpur Highway (OUT-21) has 71% (5 complaints). Warn them that they need to submit audits.
3. If asked about resolving complaints, instruct them to open the CRM page, select the ticket, and click 'Mark Resolved'.
4. If asked about stockouts, overstocks, or lost sales risk, quote these mismatch records. Instruct the user to open the SKU Dashboard page and click 'Restock' or 'Discount' next to the corresponding mismatch to resolve it.
5. If asked about refrigerator alerts or dairy spoilage risk, immediately point out that Bopal Crossroad (OUT-05) fridge temperature is at 6.2°C, which is above the safe threshold of 5°C, risking food safety.
6. If asked about supply chain, shipment progress, active promotions, or KDS prep latency, cite the records above.
7. Answer questions direct, operational, concise, and structured. Use markdown bolding and lists. Do not mention that you are mock data or a mock system. Address HQ managers professionally.

=== DYNAMIC GRAPH VISUALIZATION COMMANDS ===
If the user asks to see, plot, graph, display, filter, chart, or analyze a specific metric or city visually, you MUST append a command at the very end of your response in the format:
[CMD: {"metric": "<metric_name>", "city": "<city_name>"}]
Where:
- <metric_name> must be one of: "sales", "hygiene", "wastage", "complaints", "inventory", "latency", "telemetry", "logistics"
- <city_name> must be "all" or the capitalized city name (e.g. "Ahmedabad", "Surat", "Vadodara", "Navsari", "Bopal", "Palanpur", "Anand", "Nadiad")

Example: If the user says "show me cook times in Bopal", reply with your text analysis, and at the end of the text append:
[CMD: {"metric": "latency", "city": "Bopal"}]`;
  }

  async function getApiKey() {
    let key = localStorage.getItem('martinoz_groq_api_key');
    if (key && key.trim()) {
      return key.trim();
    }

    try {
      const response = await fetch('/.env');
      if (response.ok) {
        const text = await response.text();
        const match = text.match(/GROQ_API_KEY\s*=\s*(gsk_[a-zA-Z0-9_]+)/) || text.match(/GROQ_API_KEY\s*=\s*([^\n\r]+)/);
        if (match && match[1]) {
          key = match[1].trim().replace(/['"]/g, '');
          if (key) {
            localStorage.setItem('martinoz_groq_api_key', key);
            return key;
          }
        }
      }
    } catch (e) {
      // Ignore env load failure
    }
    return null;
  }

  function appendApiKeyPrompt(onSuccess) {
    if (chatMessagesContainer.querySelector('.api-key-prompt-bubble')) {
      return;
    }

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble agent api-key-prompt-bubble';
    bubble.innerHTML = `
      <div style="margin-bottom: 12px;">
        🔑 <strong>Groq API Key Required</strong><br>
        Martinoz OS is running in serverless client-only mode. Enter your Groq API key to activate the operations assistant. It will be cached securely in your browser's local storage.
      </div>
      <div style="display: flex; gap: 8px; width: 100%; box-sizing: border-box;">
        <input type="password" id="copilot-api-key-input" placeholder="gsk_..." style="
          flex-grow: 1;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-glass);
          color: #fff;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          outline: none;
        " />
        <button id="copilot-api-key-submit" style="
          background: var(--primary);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          cursor: pointer;
          font-weight: 600;
        ">Submit</button>
      </div>
    `;
    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    const input = bubble.querySelector('#copilot-api-key-input');
    const btn = bubble.querySelector('#copilot-api-key-submit');

    const handleSubmit = () => {
      const val = input.value.trim();
      if (val) {
        localStorage.setItem('martinoz_groq_api_key', val);
        bubble.innerHTML = `✅ <strong>API Key Saved!</strong> Activating assistant...`;
        setTimeout(() => {
          if (bubble && bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
          }
        }, 1500);
        onSuccess(val);
      }
    };

    btn.addEventListener('click', handleSubmit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    });
    input.focus();
  }

  async function fetchCopilotResponse(typingIndicatorNode) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      if (typingIndicatorNode && typingIndicatorNode.parentNode) {
        typingIndicatorNode.parentNode.removeChild(typingIndicatorNode);
      }
      appendApiKeyPrompt(() => {
        const newIndicator = appendTypingIndicator();
        fetchCopilotResponse(newIndicator);
      });
      return;
    }

    const systemContext = generateSystemContext();
    
    // Assemble recent dialogue turns
    const messages = [
      { role: "system", content: systemContext }
    ];
    
    const recentHistory = chatHistory.slice(-6);
    recentHistory.forEach(h => {
      messages.push({ role: h.role, content: h.content });
    });

    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: messages,
        temperature: 0.2
      })
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('martinoz_groq_api_key');
          throw new Error("Invalid API Key. Please enter a valid key.");
        }
        throw new Error(`Server returned code ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      // Remove typing indicator
      if (typingIndicatorNode && typingIndicatorNode.parentNode) {
        typingIndicatorNode.parentNode.removeChild(typingIndicatorNode);
      }

      let answer = '';
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        answer = data.choices[0].message.content;
      } else if (data && data.error) {
        answer = `⚠️ **API Error**: ${data.error}`;
      } else {
        answer = "I encountered an error receiving an answer from the operational forecasting system.";
      }

      // Check for command tag [CMD: ...] to update the Graph view
      const cmdRegex = /\[CMD:\s*(\{.*?\})\s*\]/;
      const match = answer.match(cmdRegex);
      
      // Add text bubble first (without command block)
      const cleanAnswer = answer.replace(cmdRegex, '').trim();
      appendMessageBubble('agent', cleanAnswer);
      
      // If command match, dynamically build chart inside chat feed
      if (match) {
        try {
          const cmdObj = JSON.parse(match[1]);
          createInlineChartCard(cmdObj.metric, cmdObj.city);
        } catch (e) {
          console.error("Failed to parse command from LLM response:", e);
        }
      }

      chatHistory.push({ role: 'assistant', content: answer });
      saveChatHistory();
    })
    .catch(err => {
      console.error("Copilot communication error:", err);
      if (typingIndicatorNode && typingIndicatorNode.parentNode) {
        typingIndicatorNode.parentNode.removeChild(typingIndicatorNode);
      }
      appendMessageBubble('agent', `⚠️ **LLM Connection Error**: ${err.message || 'Unable to connect to Groq API. Please check your network and API key.'}`);
    });
  }


  // ==========================================================================
  // PART 2: DYNAMIC INLINE GRAPH ENGINE (BI CHARTS IN CHAT)
  // ==========================================================================

  function getMetricTitle(metric) {
    switch(metric) {
      case 'sales': return 'Sales Performance (₹)';
      case 'hygiene': return 'Hygiene Compliance (%)';
      case 'wastage': return 'Food Wastage (kg)';
      case 'complaints': return 'Active CRM Complaints';
      case 'inventory': return 'Stock vs Demand Alignment';
      case 'latency': return 'Kitchen Prep Latency (mins)';
      case 'telemetry': return 'IoT Cold Store Telemetry (°C)';
      case 'logistics': return 'Ingredient Distribution Shipments (%)';
      default: return 'Franchise Metrics';
    }
  }

  function getCityTitle(city) {
    return city === 'all' ? 'All Territories' : city;
  }

  function getMetricLabel(metric) {
    switch(metric) {
      case 'sales': return 'Sales Revenue';
      case 'hygiene': return 'Hygiene Score';
      case 'wastage': return 'Wastage Quantity';
      case 'complaints': return 'Open Tickets';
      case 'inventory': return 'Stock vs Demand';
      case 'latency': return 'Avg Prep Time';
      case 'telemetry': return 'Fridge Temperature';
      case 'logistics': return 'Transit Progress';
      default: return 'Value';
    }
  }

  function getMetricFormatter(metric) {
    switch(metric) {
      case 'sales': return val => '₹' + val.toLocaleString('en-IN');
      case 'hygiene': return val => val + '%';
      case 'wastage': return val => val.toFixed(1) + ' kg';
      case 'complaints': return val => val + ' Ticket(s)';
      case 'inventory': return val => val + ' units';
      case 'latency': return val => val + ' mins';
      case 'telemetry': return val => val.toFixed(1) + '°C';
      case 'logistics': return val => val + '%';
      default: return val => val;
    }
  }

  function createInlineChartCard(metric, city) {
    const chartId = 'chart-' + Math.random().toString(36).substring(2, 9);
    
    const chartCard = document.createElement('div');
    chartCard.className = 'chat-bubble agent inline-chart-card';
    chartCard.innerHTML = `
      <div class="inline-chart-header">
        <h4><i class="fa-solid fa-chart-column highlight-orange"></i> ${getMetricTitle(metric)} - ${getCityTitle(city)}</h4>
        <span class="badge badge-info" style="font-size: 8px;">BI Analytics Card</span>
      </div>
      <div class="inline-chart-wrapper">
        <canvas id="${chartId}"></canvas>
      </div>
      <div class="inline-stats-grid" id="stats-${chartId}"></div>
    `;
    
    chatMessagesContainer.appendChild(chartCard);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    
    // Draw the chart on the newly appended canvas element
    drawInlineChart(chartId, metric, city);
  }

  function drawInlineChart(chartId, metric, city) {
    const outlets = Database.getOutlets();

    if (metric === 'inventory') {
      const skus = Database.getSkus();
      const inventory = Database.getInventory();
      
      const filteredInv = city === 'all'
        ? inventory
        : inventory.filter(item => {
            const outlet = outlets.find(o => o.id === item.outletId);
            return outlet && outlet.city.toLowerCase() === city.toLowerCase();
          });

      const skuLabels = skus.map(s => s.name);
      const stockData = [];
      const demandData = [];

      skus.forEach(sku => {
        const matches = filteredInv.filter(item => item.skuId === sku.id);
        let sumStock = 0;
        let sumDemand = 0;
        matches.forEach(m => {
          sumStock += m.stock;
          sumDemand += m.demand;
        });
        stockData.push(sumStock);
        demandData.push(sumDemand);
      });

      const canvas = document.getElementById(chartId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: skuLabels,
          datasets: [
            {
              label: 'Stock Level',
              data: stockData,
              backgroundColor: 'rgba(0, 180, 216, 0.75)',
              borderColor: 'rgba(0, 180, 216, 1)',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Projected Demand',
              data: demandData,
              backgroundColor: 'rgba(255, 107, 53, 0.75)',
              borderColor: 'rgba(255, 107, 53, 1)',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: { color: '#9ea8b6', font: { family: 'Inter', size: 9 } }
            },
            tooltip: {
              backgroundColor: '#0c0e12',
              titleFont: { family: 'Outfit', size: 11, weight: 'bold' },
              bodyFont: { family: 'Inter', size: 11 },
              borderColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#f8f9fa', font: { family: 'Inter', size: 8.5 } }
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.08)'
              },
              ticks: { color: '#9ea8b6', font: { family: 'Inter', size: 9 } }
            }
          }
        }
      });

      populateInlineStats('stats-' + chartId, filteredInv, 'inventory');
      return;
    }
    
    // Filter outlets by territory city (case-insensitive)
    const filteredOutlets = city === 'all' 
      ? outlets 
      : outlets.filter(o => o.city.toLowerCase() === city.toLowerCase());

    // Sort descending by metric
    if (metric === 'sales') {
      filteredOutlets.sort((a, b) => b.sales - a.sales);
    } else if (metric === 'hygiene') {
      filteredOutlets.sort((a, b) => a.hygieneScore - b.hygieneScore); // lowest hygiene score first to flag issues
    } else if (metric === 'wastage') {
      filteredOutlets.sort((a, b) => b.wastageKg - a.wastageKg);
    } else if (metric === 'complaints') {
      filteredOutlets.sort((a, b) => b.openComplaints - a.openComplaints);
    } else if (metric === 'latency') {
      filteredOutlets.sort((a, b) => {
        const oA = Database.getKds().filter(ord => ord.outletId === a.id);
        const oB = Database.getKds().filter(ord => ord.outletId === b.id);
        const avgA = oA.length > 0 ? oA.reduce((s, x) => s + x.prepTimeMinutes, 0) / oA.length : 12;
        const avgB = oB.length > 0 ? oB.reduce((s, x) => s + x.prepTimeMinutes, 0) / oB.length : 12;
        return avgB - avgA;
      });
    } else if (metric === 'telemetry') {
      filteredOutlets.sort((a, b) => {
        const tempA = Database.getIot().find(t => t.outletId === a.id)?.fridgeTemp || 3.0;
        const tempB = Database.getIot().find(t => t.outletId === b.id)?.fridgeTemp || 3.0;
        return tempB - tempA;
      });
    }

    let labels = [];
    let chartData = [];

    if (metric === 'logistics') {
      const shipments = Database.getShipments();
      labels = shipments.map(s => `${s.id} to ${s.destination.split(' ')[0]}`);
      chartData = shipments.map(s => s.progress);
    } else {
      labels = filteredOutlets.map(o => o.name);
      if (metric === 'sales') chartData = filteredOutlets.map(o => o.sales);
      else if (metric === 'hygiene') chartData = filteredOutlets.map(o => o.hygieneScore);
      else if (metric === 'wastage') chartData = filteredOutlets.map(o => o.wastageKg);
      else if (metric === 'complaints') chartData = filteredOutlets.map(o => o.openComplaints);
      else if (metric === 'latency') {
        chartData = filteredOutlets.map(o => {
          const orders = Database.getKds().filter(ord => ord.outletId === o.id);
          const sum = orders.reduce((s, ord) => s + ord.prepTimeMinutes, 0);
          return orders.length > 0 ? Math.round(sum / orders.length) : 12;
        });
      }
      else if (metric === 'telemetry') {
        chartData = filteredOutlets.map(o => {
          const entry = Database.getIot().find(t => t.outletId === o.id);
          return entry ? entry.fridgeTemp : 3.0;
        });
      }
    }

    const labelText = getMetricLabel(metric);
    const formatFn = getMetricFormatter(metric);

    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Theme color adjustments
    let barColorStart = 'rgba(255, 107, 53, 0.85)';
    let barColorEnd = 'rgba(255, 107, 53, 0.2)';
    let borderTheme = 'rgba(255, 107, 53, 1)';

    if (metric === 'hygiene') {
      barColorStart = 'rgba(56, 176, 0, 0.85)';
      barColorEnd = 'rgba(56, 176, 0, 0.2)';
      borderTheme = 'rgba(56, 176, 0, 1)';
    } else if (metric === 'wastage') {
      barColorStart = 'rgba(255, 183, 3, 0.85)';
      barColorEnd = 'rgba(255, 183, 3, 0.2)';
      borderTheme = 'rgba(255, 183, 3, 1)';
    } else if (metric === 'complaints') {
      barColorStart = 'rgba(217, 4, 41, 0.85)';
      barColorEnd = 'rgba(217, 4, 41, 0.2)';
      borderTheme = 'rgba(217, 4, 41, 1)';
    } else if (metric === 'latency') {
      barColorStart = 'rgba(255, 183, 3, 0.85)';
      barColorEnd = 'rgba(255, 183, 3, 0.2)';
      borderTheme = 'rgba(255, 183, 3, 1)';
    } else if (metric === 'telemetry') {
      barColorStart = 'rgba(0, 180, 216, 0.85)';
      barColorEnd = 'rgba(0, 180, 216, 0.2)';
      borderTheme = 'rgba(0, 180, 216, 1)';
    } else if (metric === 'logistics') {
      barColorStart = 'rgba(56, 176, 0, 0.85)';
      barColorEnd = 'rgba(56, 176, 0, 0.2)';
      borderTheme = 'rgba(56, 176, 0, 1)';
    }

    const gradient = ctx.createLinearGradient(0, 0, 450, 0);
    gradient.addColorStop(0, barColorStart);
    gradient.addColorStop(1, barColorEnd);

    const isLargeSet = labels.length > 15;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: labelText,
          data: chartData,
          backgroundColor: gradient,
          borderColor: borderTheme,
          borderWidth: 1,
          borderRadius: 4,
          barThickness: isLargeSet ? 8 : 'flex',
          maxBarThickness: 24
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0c0e12',
            titleFont: { family: 'Outfit', size: 11, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 11 },
            borderColor: borderTheme,
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${formatFn(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.08)'
            },
            ticks: {
              color: '#9ea8b6',
              font: { family: 'Inter', size: 9 },
              callback: function(value) { return formatFn(value); }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#f8f9fa',
              font: { family: 'Inter', size: 9 }
            }
          }
        }
      }
    });

    // Generate stats cards
    if (metric === 'logistics') {
      populateInlineStats('stats-' + chartId, Database.getShipments(), metric);
    } else {
      populateInlineStats('stats-' + chartId, filteredOutlets, metric);
    }
  }

  function populateInlineStats(containerId, dataList, metric) {
    const statsContainer = document.getElementById(containerId);
    if (!statsContainer) return;

    if (dataList.length === 0) {
      statsContainer.innerHTML = `
        <div class="inline-stat-card" style="grid-column: span 3;">
          <div class="inline-stat-label">No locations matching filter</div>
        </div>
      `;
      return;
    }

    if (metric === 'sales') {
      let totalSales = 0;
      let maxSales = -1;
      let topOutlet = null;
      dataList.forEach(o => {
        totalSales += o.sales;
        if (o.sales > maxSales) { maxSales = o.sales; topOutlet = o; }
      });
      const avgSales = totalSales / dataList.length;
      statsContainer.innerHTML = `
        <div class="inline-stat-card">
          <div class="inline-stat-label">Total Revenue</div>
          <div class="inline-stat-value highlight-orange">₹${totalSales.toLocaleString('en-IN')}</div>
          <div class="inline-stat-meta">${dataList.length} Outlet(s)</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Average Sales</div>
          <div class="inline-stat-value">₹${Math.round(avgSales).toLocaleString('en-IN')}</div>
          <div class="inline-stat-meta">Per location</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Top Branch</div>
          <div class="inline-stat-value highlight-gold">${topOutlet.name}</div>
          <div class="inline-stat-meta">₹${topOutlet.sales.toLocaleString('en-IN')}</div>
        </div>
      `;
    } else if (metric === 'hygiene') {
      let sumHygiene = 0;
      let minHygiene = 999;
      let worstOutlet = null;
      let substandardCount = 0;
      dataList.forEach(o => {
        sumHygiene += o.hygieneScore;
        if (o.hygieneScore < minHygiene) { minHygiene = o.hygieneScore; worstOutlet = o; }
        if (o.hygieneScore < 80) substandardCount++;
      });
      const avgHygiene = sumHygiene / dataList.length;
      statsContainer.innerHTML = `
        <div class="inline-stat-card">
          <div class="inline-stat-label">Avg Hygiene</div>
          <div class="inline-stat-value highlight-green">${avgHygiene.toFixed(1)}%</div>
          <div class="inline-stat-meta">Benchmark: 80%</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Critical Risks</div>
          <div class="inline-stat-value ${substandardCount > 0 ? 'highlight-red' : ''}">${substandardCount}</div>
          <div class="inline-stat-meta">Scoring &lt; 80%</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Lowest Audit</div>
          <div class="inline-stat-value highlight-red">${worstOutlet.name}</div>
          <div class="inline-stat-meta">Score: ${worstOutlet.hygieneScore}%</div>
        </div>
      `;
    } else if (metric === 'wastage') {
      let totalWastage = 0;
      let maxWastage = -1;
      let worstOutlet = null;
      dataList.forEach(o => {
        totalWastage += o.wastageKg;
        if (o.wastageKg > maxWastage) { maxWastage = o.wastageKg; worstOutlet = o; }
      });
      const avgWastage = totalWastage / dataList.length;
      statsContainer.innerHTML = `
        <div class="inline-stat-card">
          <div class="inline-stat-label">Total Wastage</div>
          <div class="inline-stat-value highlight-gold">${totalWastage.toFixed(1)} kg</div>
          <div class="inline-stat-meta">Dough & ingredients</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Average Wastage</div>
          <div class="inline-stat-value">${avgWastage.toFixed(1)} kg</div>
          <div class="inline-stat-meta">Per kitchen</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Highest Waste</div>
          <div class="inline-stat-value highlight-red">${worstOutlet.name}</div>
          <div class="inline-stat-meta">${worstOutlet.wastageKg.toFixed(1)} kg</div>
        </div>
      `;
    } else if (metric === 'complaints') {
      let totalComplaints = 0;
      let maxComplaints = -1;
      let worstOutlet = null;
      dataList.forEach(o => {
        totalComplaints += o.openComplaints;
        if (o.openComplaints > maxComplaints) { maxComplaints = o.openComplaints; worstOutlet = o; }
      });
      statsContainer.innerHTML = `
        <div class="inline-stat-card">
          <div class="inline-stat-label">Total Complaints</div>
          <div class="inline-stat-value highlight-red">${totalComplaints} Active</div>
          <div class="inline-stat-meta">Unresolved tickets</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Pending Reviews</div>
          <div class="inline-stat-value">${totalComplaints}</div>
          <div class="inline-stat-meta">SLA breach warnings</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Most Complaints</div>
          <div class="inline-stat-value highlight-red">${totalComplaints > 0 ? worstOutlet.name : 'None'}</div>
          <div class="inline-stat-meta">${totalComplaints > 0 ? `Tickets: ${worstOutlet.openComplaints}` : 'Clean record'}</div>
        </div>
      `;
    } else if (metric === 'inventory') {
      const skus = Database.getSkus();
      let totalLostSales = 0;
      let totalWastageVal = 0;
      let alignedCount = 0;

      dataList.forEach(item => {
        const sku = skus.find(s => s.id === item.skuId);
        if (!sku) return;
        const diff = item.stock - item.demand;
        if (diff < 0) {
          totalLostSales += Math.abs(diff) * sku.price;
        } else if (diff > 0) {
          totalWastageVal += diff * sku.price;
        }
        if (Math.abs(diff) <= 5) {
          alignedCount++;
        }
      });
      const score = dataList.length > 0 ? Math.round((alignedCount / dataList.length) * 100) : 100;

      statsContainer.innerHTML = `
        <div class="inline-stat-card">
          <div class="inline-stat-label">Lost Sales</div>
          <div class="inline-stat-value highlight-red">₹${totalLostSales.toLocaleString('en-IN')}</div>
          <div class="inline-stat-meta">From stockouts</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Wastage Risk</div>
          <div class="inline-stat-value highlight-gold">₹${totalWastageVal.toLocaleString('en-IN')}</div>
          <div class="inline-stat-meta">From overstock</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Stock Alignment</div>
          <div class="inline-stat-value highlight-green">${score}%</div>
          <div class="inline-stat-meta">Margin threshold: &le;5 units</div>
        </div>
      `;
    } else if (metric === 'latency') {
      const kdsData = Database.getKds();
      let sumTime = 0;
      let maxTime = -1;
      let worstOutlet = null;
      let delayedCount = 0;

      dataList.forEach(o => {
        const orders = kdsData.filter(ord => ord.outletId === o.id);
        const sum = orders.reduce((s, ord) => s + ord.prepTimeMinutes, 0);
        const avg = orders.length > 0 ? Math.round(sum / orders.length) : 12;
        
        sumTime += avg;
        if (avg > maxTime) {
          maxTime = avg;
          worstOutlet = o;
        }
        if (avg > 15) delayedCount++;
      });

      const avgLatency = dataList.length > 0 ? Math.round(sumTime / dataList.length) : 0;
      statsContainer.innerHTML = `
        <div class="inline-stat-card">
          <div class="inline-stat-label">Avg Prep Latency</div>
          <div class="inline-stat-value highlight-gold">${avgLatency} mins</div>
          <div class="inline-stat-meta">Target limit: 15 mins</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Delayed Branches</div>
          <div class="inline-stat-value ${delayedCount > 0 ? 'highlight-red' : ''}">${delayedCount}</div>
          <div class="inline-stat-meta">Averaging &gt;15 mins</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Slowest Prep</div>
          <div class="inline-stat-value highlight-red">${worstOutlet ? worstOutlet.name : 'N/A'}</div>
          <div class="inline-stat-meta">${maxTime} mins avg prep</div>
        </div>
      `;
    } else if (metric === 'telemetry') {
      const iotData = Database.getIot();
      let sumTemp = 0;
      let maxTemp = -99;
      let worstOutlet = null;
      let breachedCount = 0;

      dataList.forEach(o => {
        const entry = iotData.find(t => t.outletId === o.id);
        const temp = entry ? entry.fridgeTemp : 3.0;
        sumTemp += temp;
        if (temp > maxTemp) {
          maxTemp = temp;
          worstOutlet = o;
        }
        if (temp > 5.0) breachedCount++;
      });

      const avgTemp = dataList.length > 0 ? sumTemp / dataList.length : 0;
      statsContainer.innerHTML = `
        <div class="inline-stat-card">
          <div class="inline-stat-label">Avg Fridge Temp</div>
          <div class="inline-stat-value highlight-green">${avgTemp.toFixed(1)}°C</div>
          <div class="inline-stat-meta">Standard: 2°C - 4°C</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Temp Breaches</div>
          <div class="inline-stat-value ${breachedCount > 0 ? 'highlight-red' : ''}">${breachedCount}</div>
          <div class="inline-stat-meta">Sensor reading &gt;5°C</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Highest Sensor</div>
          <div class="inline-stat-value highlight-red">${worstOutlet ? worstOutlet.name : 'N/A'}</div>
          <div class="inline-stat-meta">${maxTemp.toFixed(1)}°C cold store</div>
        </div>
      `;
    } else if (metric === 'logistics') {
      let sumProgress = 0;
      let transitCount = 0;
      let completedCount = 0;

      dataList.forEach(s => {
        sumProgress += s.progress;
        if (s.status === 'In Transit' || s.status === 'Near Destination') transitCount++;
        if (s.status === 'Delivered') completedCount++;
      });

      const avgProgress = dataList.length > 0 ? Math.round(sumProgress / dataList.length) : 0;
      statsContainer.innerHTML = `
        <div class="inline-stat-card">
          <div class="inline-stat-label">Avg Route Progress</div>
          <div class="inline-stat-value highlight-orange">${avgProgress}%</div>
          <div class="inline-stat-meta">Average transit level</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Active Trucks</div>
          <div class="inline-stat-value highlight-gold">${transitCount}</div>
          <div class="inline-stat-meta">En route currently</div>
        </div>
        <div class="inline-stat-card">
          <div class="inline-stat-label">Delivered Shipments</div>
          <div class="inline-stat-value highlight-green">${completedCount}</div>
          <div class="inline-stat-meta">Successfully completed</div>
        </div>
      `;
    }
  }
  }

  // ==========================================================================
  // PART 3: INITIALIZATION TRIGGER
  // ==========================================================================

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initNotebook);
  } else {
    initNotebook();
  }

})();
