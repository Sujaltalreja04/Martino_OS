/* ==========================================================================
   Martinoz Franchise Intelligence Platform - Dashboard Logic (dashboard.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure database is connected
  if (typeof Database === 'undefined') {
    console.error('Database mock library data.js is not loaded.');
    return;
  }

  // --- Element Bindings ---
  const statRevenue = document.getElementById('stat-revenue');
  const statOrders = document.getElementById('stat-orders');
  const statHygiene = document.getElementById('stat-hygiene');
  const statComplaints = document.getElementById('stat-complaints');
  const hygieneTrend = document.getElementById('hygiene-trend-container');
  const complaintsTrend = document.getElementById('complaints-trend-container');

  const aiInsightsContainer = document.getElementById('ai-insights-container');
  
  const riskOutletsCount = document.getElementById('risk-outlets-count');
  const riskOutletsTbody = document.getElementById('risk-outlets-tbody');

  const leaderboardListContainer = document.getElementById('leaderboard-list-container');
  const leaderboardTopBtn = document.getElementById('leaderboard-top-btn');
  const leaderboardBottomBtn = document.getElementById('leaderboard-bottom-btn');
  
  const headerNotifCount = document.getElementById('header-notif-count');

  let currentLeaderboardMode = 'top'; // 'top' or 'bottom'

  // ==========================================
  // 1. Data Processing and Stat Bindings
  // ==========================================
  
  function loadDashboardData() {
    const stats = Database.getGlobalStats();
    const outlets = Database.getOutlets();
    const tickets = Database.getTickets();

    // Render Stats
    statRevenue.textContent = `₹${stats.totalRevenue.toLocaleString('en-IN')}`;
    statOrders.textContent = stats.totalOrders.toLocaleString('en-IN');
    statHygiene.textContent = `${stats.avgHygieneScore.toFixed(1)}%`;
    statComplaints.textContent = stats.openComplaints;

    // Update Progress Bars dynamically
    const revenueTarget = 200000;
    const ordersTarget = 8000;
    const complaintsThreshold = 10;

    const revenuePct = Math.min((stats.totalRevenue / revenueTarget) * 100, 100);
    const ordersPct = Math.min((stats.totalOrders / ordersTarget) * 100, 100);
    const hygienePct = stats.avgHygieneScore;
    const complaintsPct = Math.min((stats.openComplaints / complaintsThreshold) * 100, 100);

    const progressRevenue = document.getElementById('progress-revenue');
    const progressOrders = document.getElementById('progress-orders');
    const progressHygiene = document.getElementById('progress-hygiene');
    const progressComplaints = document.getElementById('progress-complaints');

    if (progressRevenue) progressRevenue.style.width = `${revenuePct}%`;
    if (progressOrders) progressOrders.style.width = `${ordersPct}%`;
    if (progressHygiene) progressHygiene.style.width = `${hygienePct}%`;
    if (progressComplaints) progressComplaints.style.width = `${complaintsPct}%`;

    // Adjust trend colors for complaints
    if (stats.openComplaints > 8) {
      complaintsTrend.className = 'stat-trend trend-down';
      complaintsTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> +12% vs Last Week`;
    } else {
      complaintsTrend.className = 'stat-trend trend-up';
      complaintsTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> -18.2% vs Last Week`;
    }

    // Set Hygiene status trend
    if (stats.avgHygieneScore >= 85) {
      hygieneTrend.className = 'stat-trend trend-up';
      hygieneTrend.innerHTML = `<i class="fa-solid fa-circle-check"></i> Standard Compliant`;
    } else {
      hygieneTrend.className = 'stat-trend trend-down';
      hygieneTrend.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Action Required`;
    }

    // Header notification count
    const totalRisks = stats.warningOutletsCount + stats.criticalOutletsCount;
    headerNotifCount.textContent = totalRisks;

    // Render Leaderboard & Risks
    renderLeaderboard(outlets);
    renderRiskOutlets(outlets);
    renderAIInsights(outlets, tickets);
  }

  // ==========================================
  // 2. Franchise Leaderboard Standings
  // ==========================================

  function renderLeaderboard(outlets) {
    leaderboardListContainer.innerHTML = '';
    
    // Sort outlets by a performance score formula: (Sales / 100) + HygieneScore - (OpenComplaints * 5)
    const outletsWithScores = outlets.map(o => {
      const perfScore = (o.sales / 100) + o.hygieneScore - (o.openComplaints * 5);
      return { ...o, perfScore };
    });

    if (currentLeaderboardMode === 'top') {
      outletsWithScores.sort((a, b) => b.perfScore - a.perfScore);
    } else {
      outletsWithScores.sort((a, b) => a.perfScore - b.perfScore);
    }

    const displayed = outletsWithScores.slice(0, 5);

    displayed.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'leaderboard-item';
      
      const rankDisplay = currentLeaderboardMode === 'top' ? (index + 1) : (outlets.length - index);
      const scoreColor = item.hygieneScore >= 85 ? 'high' : 'low';
      
      itemEl.innerHTML = `
        <div class="rank-meta">
          <div class="rank-badge rank-${rankDisplay}">${rankDisplay}</div>
          <div>
            <div class="outlet-name">${item.name}</div>
            <div class="outlet-city">${item.city}</div>
          </div>
        </div>
        <div class="rank-score ${scoreColor}">
          ${item.hygieneScore}% <span style="font-size:10px; color:var(--text-muted); font-weight:normal;">hygiene</span>
        </div>
      `;
      leaderboardListContainer.appendChild(itemEl);
    });
  }

  leaderboardTopBtn.addEventListener('click', () => {
    leaderboardTopBtn.classList.add('active');
    leaderboardBottomBtn.classList.remove('active');
    currentLeaderboardMode = 'top';
    const outlets = Database.getOutlets();
    renderLeaderboard(outlets);
  });

  leaderboardBottomBtn.addEventListener('click', () => {
    leaderboardBottomBtn.classList.add('active');
    leaderboardTopBtn.classList.remove('active');
    currentLeaderboardMode = 'bottom';
    const outlets = Database.getOutlets();
    renderLeaderboard(outlets);
  });

  // ==========================================
  // 3. High-Risk Outlets Checklist
  // ==========================================

  function renderRiskOutlets(outlets) {
    riskOutletsTbody.innerHTML = '';
    
    const riskOutlets = outlets.filter(o => o.alertStatus === 'warning' || o.alertStatus === 'critical');
    
    riskOutletsCount.textContent = `${riskOutlets.length} Outlets`;
    
    if (riskOutlets.length === 0) {
      riskOutletsTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">
            <i class="fa-solid fa-circle-check text-green"></i> No high-risk outlets detected today.
          </td>
        </tr>
      `;
      return;
    }

    riskOutlets.forEach(o => {
      const badgeClass = o.alertStatus === 'critical' ? 'badge-danger' : 'badge-warning';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${o.id}</strong></td>
        <td>${o.name}</td>
        <td>${o.city}</td>
        <td><span class="badge ${o.hygieneScore < 75 ? 'badge-danger' : 'badge-warning'}">${o.hygieneScore}%</span></td>
        <td><span class="badge ${o.openComplaints >= 4 ? 'badge-danger' : 'badge-warning'}">${o.openComplaints} Tickets</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="window.location.href='command-center.html?search=${o.id}'">
            Inspect
          </button>
        </td>
      `;
      riskOutletsTbody.appendChild(tr);
    });
  }

  // ==========================================
  // 4. AI Dynamic Insights Generator
  // ==========================================

  function renderAIInsights(outlets, tickets) {
    aiInsightsContainer.innerHTML = '';

    const insights = [];

    // Check critical complaints first
    const criticalTickets = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved');
    criticalTickets.forEach(t => {
      insights.push({
        type: 'critical',
        title: `Food Safety Incident Breached in ${t.outletName}`,
        desc: `Ticket ${t.id} (${t.category}): "${t.description}" is active. Urgent action required to prevent FSSAI audit penalties.`
      });
    });

    // Check low hygiene scores
    outlets.forEach(o => {
      if (o.hygieneScore < 75) {
        insights.push({
          type: 'warning',
          title: `Hygiene Score Alert: ${o.name}`,
          desc: `Cleanliness score has dropped to ${o.hygieneScore}%. Daily checklists are missing photo audit confirmations for cooking lines.`
        });
      }
    });

    // Check high wastage outlets
    outlets.forEach(o => {
      if (o.wastageKg > 20) {
        insights.push({
          type: 'info',
          title: `Excess Food Waste: ${o.name}`,
          desc: `Wastage exceeded limit at ${o.wastageKg}kg. System suggests decreasing prep count for garlic bread dough by 15% tomorrow.`
        });
      }
    });

    // General demand insight
    insights.push({
      type: 'info',
      title: 'Weekend Demand Forecast Peak',
      desc: 'High temperature (+36°C) and upcoming Sunday holiday predicted to increase beverage demands by 22.4% across Surat branches.'
    });

    // Take top 4 insights
    const displayedInsights = insights.slice(0, 4);

    displayedInsights.forEach(ins => {
      const item = document.createElement('div');
      item.className = `ai-alert-item ${ins.type}`;
      
      let icon = 'fa-circle-info';
      if (ins.type === 'critical') icon = 'fa-triangle-exclamation';
      if (ins.type === 'warning') icon = 'fa-circle-exclamation';

      item.innerHTML = `
        <div class="alert-badge-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="alert-body">
          <h4>${ins.title}</h4>
          <p>${ins.desc}</p>
        </div>
      `;
      aiInsightsContainer.appendChild(item);
    });
  }

  // Load on start
  loadDashboardData();

});
