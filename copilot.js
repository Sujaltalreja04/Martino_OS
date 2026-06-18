/* ==========================================================================
   Martinoz Franchise Intelligence Platform - AI Copilot client (copilot.js)
   Dynamically injects the floating chat button and handles chat communications.
   ========================================================================== */

(function() {
  'use strict';

  // --- Dynamic Style Injection ---
  const COPILOT_STYLES = `
    .copilot-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, var(--primary), #ff8252);
      color: #fff;
      border: none;
      padding: 12px 20px;
      border-radius: var(--radius-full);
      box-shadow: 0 4px 20px rgba(255, 107, 53, 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .copilot-launcher:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 6px 25px rgba(255, 107, 53, 0.5);
    }
    .copilot-launcher i {
      font-size: 16px;
    }
    
    .copilot-chat-drawer {
      position: fixed;
      top: 0;
      right: -420px;
      width: 420px;
      height: 100vh;
      background: rgba(18, 22, 29, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-left: 1px solid var(--border-glass);
      box-shadow: -10px 0 40px rgba(0,0,0,0.5);
      z-index: 1010;
      display: flex;
      flex-direction: column;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .copilot-chat-drawer.open {
      right: 0;
    }
    
    .copilot-chat-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-glass);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(8, 10, 13, 0.5);
    }
    .copilot-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon-copilot {
      color: var(--primary);
      font-size: 24px;
    }
    .copilot-title h4 {
      font-size: 14px;
      font-weight: 700;
    }
    .copilot-status {
      font-size: 10px;
      color: var(--success);
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      margin-top: 2px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      background: var(--success);
      border-radius: 50%;
      display: inline-block;
      animation: pulseGreen 2s infinite;
    }
    
    .copilot-close-btn, .copilot-clear-btn {
      color: var(--text-secondary);
      font-size: 18px;
      background: none;
      border: none;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-smooth);
    }
    .copilot-close-btn:hover, .copilot-clear-btn:hover {
      background: var(--border-glass);
      color: var(--text-primary);
    }
    
    .copilot-chat-messages {
      flex-grow: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .copilot-msg {
      display: flex;
      flex-direction: column;
      max-width: 80%;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      line-height: 1.5;
      animation: bubbleFadeIn 0.3s ease-out;
    }
    .copilot-msg-user {
      align-self: flex-end;
      background: var(--primary);
      color: #fff;
      border-bottom-right-radius: 2px;
    }
    .copilot-msg-agent {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-glass);
      color: var(--text-primary);
      border-bottom-left-radius: 2px;
    }
    .copilot-msg-agent p {
      margin-bottom: 6px;
    }
    .copilot-msg-agent p:last-child {
      margin-bottom: 0;
    }
    .copilot-msg-agent ul, .copilot-msg-agent ol {
      margin-left: 18px;
      margin-bottom: 6px;
    }
    
    .copilot-chat-input-area {
      padding: 20px 24px;
      border-top: 1px solid var(--border-glass);
      background: rgba(8, 10, 13, 0.5);
      display: flex;
      gap: 12px;
    }
    .copilot-chat-input-area input {
      flex-grow: 1;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border-glass);
      color: #fff;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
    }
    .copilot-chat-input-area input:focus {
      border-color: var(--primary);
      outline: none;
    }
    .copilot-chat-input-area button {
      width: 38px;
      height: 38px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .copilot-chat-input-area button:hover {
      background: var(--primary-hover);
    }
    
    /* Typing indicator styling */
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
    }
    .dot-typing {
      width: 6px;
      height: 6px;
      background: var(--text-secondary);
      border-radius: 50%;
      animation: typingAnimation 1.4s infinite ease-in-out both;
    }
    .dot-typing:nth-child(1) { animation-delay: -0.32s; }
    .dot-typing:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes pulseGreen {
      0% { box-shadow: 0 0 0 0 rgba(56, 176, 0, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(56, 176, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(56, 176, 0, 0); }
    }
    @keyframes bubbleFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes typingAnimation {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }
  `;

  // ==========================================
  // 1. Injected Markup Generation
  // ==========================================

  function injectCopilotElements() {
    // Inject Stylesheet
    const styleNode = document.createElement('style');
    styleNode.textContent = COPILOT_STYLES;
    document.head.appendChild(styleNode);

    // Inject Launcher Button
    const launcher = document.createElement('button');
    launcher.className = 'copilot-launcher';
    launcher.id = 'copilot-launcher-btn';
    launcher.innerHTML = `
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span>FIP Copilot</span>
    `;
    document.body.appendChild(launcher);

    // Inject Drawer Container
    const drawer = document.createElement('div');
    drawer.className = 'copilot-chat-drawer';
    drawer.id = 'copilot-chat-drawer';
    drawer.innerHTML = `
      <div class="copilot-chat-header">
        <div class="copilot-title">
          <i class="fa-solid fa-robot logo-icon-copilot"></i>
          <div>
            <h4>Martinoz Operations Copilot</h4>
            <span class="copilot-status"><span class="status-dot"></span> AI Agent Active</span>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="copilot-clear-btn" id="copilot-clear-chat" title="Clear Chat history"><i class="fa-solid fa-trash-can"></i></button>
          <button class="copilot-close-btn" id="copilot-close-chat" aria-label="Close Chat"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      
      <div class="copilot-chat-messages" id="copilot-chat-messages-container">
        <!-- Messages loaded here -->
      </div>
      
      <form class="copilot-chat-input-area" id="copilot-chat-input-form">
        <input type="text" id="copilot-chat-input" placeholder="Ask about sales, hygiene scores, or prep forecasts..." required autocomplete="off">
        <button type="submit" id="copilot-chat-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
      </form>
    `;
    document.body.appendChild(drawer);
  }

  // ==========================================
  // 2. System Context Compilation
  // ==========================================

  function generateSystemContext() {
    if (typeof Database === 'undefined') {
      return "You are the operations AI Copilot for Martinoz Pizza HQ.";
    }

    const stats = Database.getGlobalStats();
    const outlets = Database.getOutlets();
    const tickets = Database.getTickets().filter(t => t.status !== 'Resolved');
    const kds = Database.getKds() || [];
    const iot = Database.getIot() || [];
    const shipments = Database.getShipments() || [];
    const promos = Database.getPromos() || [];

    // Create compact summaries
    const outletsSummary = outlets.map(o => 
      `- ${o.id}: ${o.name} (${o.city}) | Manager: ${o.manager} | Sales: ₹${o.sales} | Orders: ${o.orders} | Hygiene: ${o.hygieneScore}% | Tickets: ${o.openComplaints} | Wastage: ${o.wastageKg.toFixed(1)}kg | Risk: ${o.alertStatus}`
    ).join('\n');

    const ticketsSummary = tickets.map(t => 
      `- ${t.id}: ${t.outletName} (${t.outletId}) | Category: ${t.category} | Urgency: ${t.priority} | SLA: ${t.slaHours}h | Desc: "${t.description}"`
    ).join('\n');

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
You assist the leadership with real-time operational analysis, compliance audits, customer complaint tracking, food prep forecasting, kitchen queues (KDS), cold chain compliance (IoT temperature logger), dynamic promotions, and distribution logistics.

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
4. If asked to predict demand/forecast prep for a branch:
   - Identify the outlet in the list and get their orders count.
   - Multiply by Saturday peak factor (1.6) and national holiday factor (1.25) to show an estimated pizza volume forecast.
   - Provide prep quantities:
     - Pizza Dough balls = estimated pizzas * 1.15 (rounded)
     - Mozzarella cheese = estimated pizzas * 0.14 kg
     - Tomato sauce = estimated pizzas * 0.12 liters
5. If asked about refrigerator alerts or dairy spoilage risk, immediately point out that Bopal Crossroad (OUT-05) fridge temperature is at 6.2°C, which is above the safe threshold of 5°C, risking food safety.
6. If asked about supply chain, shipment progress, active promotions, or KDS prep latency, cite the records above.
7. Answer questions direct, operational, concise, and structured. Use markdown bolding and lists. Do not mention that you are mock data or a mock system. Address HQ managers professionally.`;
  }

  // ==========================================
  // 3. Dialogue Manager
  // ==========================================

  let chatHistory = [];
  const LOCAL_STORAGE_KEY = 'martinoz_fip_copilot_chat';

  function initChat() {
    const launcherBtn = document.getElementById('copilot-launcher-btn');
    const chatDrawer = document.getElementById('copilot-chat-drawer');
    const closeChatBtn = document.getElementById('copilot-close-chat');
    const clearChatBtn = document.getElementById('copilot-clear-chat');
    const chatMessagesContainer = document.getElementById('copilot-chat-messages-container');
    const inputForm = document.getElementById('copilot-chat-input-form');
    const chatInput = document.getElementById('copilot-chat-input');

    // Toggle panel
    launcherBtn.addEventListener('click', () => {
      chatDrawer.classList.toggle('open');
      if (chatDrawer.classList.contains('open')) {
        chatInput.focus();
      }
    });

    closeChatBtn.addEventListener('click', () => {
      chatDrawer.classList.remove('open');
    });

    clearChatBtn.addEventListener('click', () => {
      chatHistory = [];
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      renderWelcomeMessage();
    });

    // Load history
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      chatHistory = JSON.parse(saved);
      renderChatHistory();
    } else {
      renderWelcomeMessage();
    }

    // Submit handler
    inputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      chatInput.value = '';
      
      // Add User Message
      appendMessage('user', text);
      chatHistory.push({ role: 'user', content: text });
      saveChatHistory();

      // Show typing indicator
      const typingIndicator = appendTypingIndicator();

      // Invoke Wrapper call
      fetchCopilotResponse(typingIndicator);
    });
  }

  function appendMessage(role, text) {
    const container = document.getElementById('copilot-chat-messages-container');
    const bubble = document.createElement('div');
    bubble.className = `copilot-msg ${role === 'user' ? 'copilot-msg-user' : 'copilot-msg-agent'}`;
    
    // Simple markdown list parser
    let parsedText = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\* (.*?)(<br>|$)/g, '<li>$1</li>');
      
    if (parsedText.includes('<li>')) {
      // wrap consecutive list items
      parsedText = parsedText.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>').replace(/<\/ul><br><ul>/g, '').replace(/<\/ul><ul>/g, '');
    }

    bubble.innerHTML = parsedText;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  function appendTypingIndicator() {
    const container = document.getElementById('copilot-chat-messages-container');
    const bubble = document.createElement('div');
    bubble.className = 'copilot-msg copilot-msg-agent';
    bubble.id = 'copilot-typing-indicator';
    bubble.innerHTML = `
      <div class="typing-bubble">
        <div class="dot-typing"></div>
        <div class="dot-typing"></div>
        <div class="dot-typing"></div>
      </div>
    `;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
  }

  function renderWelcomeMessage() {
    const container = document.getElementById('copilot-chat-messages-container');
    container.innerHTML = '';
    
    const welcome = `Hello! I am the **Martinoz Operations Copilot**.<br><br>
I have direct access to our real-time sales registry, customer complaints CRM, and food safety checklists.<br><br>
Ask me questions like:<br>
* **"Which outlet has the highest sales today?"**<br>
* **"How many unresolved complaints do we have?"**<br>
* **"Which outlets are at critical compliance risk?"**<br>
* **"What is Bopal Crossroad's current hygiene score?"**<br>
* **"What should I prep for Surat Ring Road tomorrow?"**`;
    
    appendMessage('agent', welcome);
  }

  function renderChatHistory() {
    const container = document.getElementById('copilot-chat-messages-container');
    container.innerHTML = '';
    chatHistory.forEach(msg => {
      appendMessage(msg.role === 'user' ? 'user' : 'agent', msg.content);
    });
  }

  function saveChatHistory() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
  }

  // ==========================================
  // 4. API Request Wrapper call
  // ==========================================

  function fetchCopilotResponse(typingIndicatorNode) {
    const systemContext = generateSystemContext();
    
    // Build context dialogue message list
    const messages = [
      { role: "system", content: systemContext }
    ];

    // Append last 6 messages to keep context history short and focused
    const recentHistory = chatHistory.slice(-6);
    recentHistory.forEach(h => {
      messages.push({ role: h.role, content: h.content });
    });

    fetch('/api/copilot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonStringify({
        messages: messages
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Server returned code ${res.status}`);
      }
      return res.json();
    })
    .navigateResponse(typingIndicatorNode)
    .catch(err => {
      console.error("Copilot communication error:", err);
      // Remove typing bubble and show fallback message
      if (typingIndicatorNode && typingIndicatorNode.parentNode) {
        typingIndicatorNode.parentNode.removeChild(typingIndicatorNode);
      }
      appendMessage('agent', `⚠️ **Connection Error**: I could not reach the operations LLM API. Please ensure that you have launched our server by running \`node server.js\` and are accessing the platform at \`http://localhost:8000\`.`);
    });
  }

  // Custom function chainer for fetch promise
  Promise.prototype.navigateResponse = function(indicatorNode) {
    return this.then(data => {
      // Remove typing bubble
      if (indicatorNode && indicatorNode.parentNode) {
        indicatorNode.parentNode.removeChild(indicatorNode);
      }

      let answer = '';
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        answer = data.choices[0].message.content;
      } else if (data && data.error) {
        answer = `⚠️ **API Error**: ${data.error}`;
      } else {
        answer = "I'm sorry, I encountered an empty response from the operational forecasting system.";
      }

      appendMessage('agent', answer);
      chatHistory.push({ role: 'assistant', content: answer });
      saveChatHistory();
    });
  };

  // Helper because standard JSON.stringify can occasionally trip up string encodings
  function jsonStringify(obj) {
    return JSON.stringify(obj);
  }

  // ==========================================
  // 5. Initializer trigger
  // ==========================================
  
  window.addEventListener('load', () => {
    if (window.location.pathname.includes('copilot.html')) {
      return;
    }
    injectCopilotElements();
    initChat();
  });

})();
