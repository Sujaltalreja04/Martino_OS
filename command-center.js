/* ==========================================================================
   Martinoz Franchise Intelligence Platform - Command Center Logic (command-center.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Database === 'undefined') {
    console.error('Database mock library data.js is not loaded.');
    return;
  }

  // --- Element Bindings ---
  const outletsTbody = document.getElementById('outlets-tbody');
  const searchInput = document.getElementById('search-outlet-input');
  const cityFilters = document.getElementById('city-filters');
  const overallStatusBadge = document.getElementById('overall-status-badge');
  
  // Drawer Inspector elements
  const inspectorOverlay = document.getElementById('outlet-inspector-overlay');
  const overlayBg = document.getElementById('overlay-bg');
  const overlayCloseBtn = document.getElementById('overlay-close-btn');

  const inspectOutletId = document.getElementById('inspect-outlet-id');
  const inspectOutletName = document.getElementById('inspect-outlet-name');
  const inspectRiskBadge = document.getElementById('inspect-risk-badge');
  const inspectManager = document.getElementById('inspect-manager');
  const inspectSales = document.getElementById('inspect-sales');
  const inspectOrders = document.getElementById('inspect-orders');
  const inspectHygiene = document.getElementById('inspect-hygiene');
  const inspectWastage = document.getElementById('inspect-wastage');
  const inspectComplaintsCount = document.getElementById('inspect-complaints-count');
  const inspectTicketsList = document.getElementById('inspect-tickets-list');
  const inspectActionAudit = document.getElementById('inspect-action-audit');
  const inspectActionComplaint = document.getElementById('inspect-action-complaint');

  let activeCityFilter = 'all';
  let searchQuery = '';
  let selectedOutletId = null;

  // ==========================================
  // 1. Rendering Outlet Rows
  // ==========================================

  function renderOutletsTable() {
    outletsTbody.innerHTML = '';
    const outlets = Database.getOutlets();

    // Filtering logic
    const filteredOutlets = outlets.filter(o => {
      // City Match
      let cityMatch = false;
      if (activeCityFilter === 'all') {
        cityMatch = true;
      } else if (activeCityFilter === 'others') {
        // Cities other than the main ones
        const mainCities = ['Surat', 'Ahmedabad', 'Vadodara', 'Navsari', 'Bopal'];
        cityMatch = !mainCities.includes(o.city);
      } else {
        cityMatch = o.city.toLowerCase() === activeCityFilter.toLowerCase();
      }

      // Search query Match (Name, ID, Manager)
      const query = searchQuery.toLowerCase().trim();
      const queryMatch = o.id.toLowerCase().includes(query) || 
                         o.name.toLowerCase().includes(query) || 
                         o.manager.toLowerCase().includes(query) ||
                         o.city.toLowerCase().includes(query);

      return cityMatch && queryMatch;
    });

    if (filteredOutlets.length === 0) {
      outletsTbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 30px;">
            <i class="fa-solid fa-store-slash" style="font-size:24px; margin-bottom:10px;"></i>
            <p>No outlets match the selected search or filter criteria.</p>
          </td>
        </tr>
      `;
      return;
    }

    filteredOutlets.forEach(o => {
      const tr = document.createElement('tr');
      
      // Hygiene class
      let hygieneClass = 'badge-success';
      if (o.hygieneScore < 70) hygieneClass = 'badge-danger';
      else if (o.hygieneScore < 80) hygieneClass = 'badge-warning';

      // Alert state badge
      let riskBadge = '<span class="badge badge-success">Normal</span>';
      if (o.alertStatus === 'critical') riskBadge = '<span class="badge badge-danger">Critical</span>';
      else if (o.alertStatus === 'warning') riskBadge = '<span class="badge badge-warning">Warning</span>';

      tr.innerHTML = `
        <td><strong>${o.id}</strong></td>
        <td>${o.name}</td>
        <td>${o.city}</td>
        <td>${o.manager}</td>
        <td>₹${o.sales.toLocaleString('en-IN')}</td>
        <td>${o.orders}</td>
        <td><span class="badge ${hygieneClass}">${o.hygieneScore}%</span></td>
        <td><span class="badge ${o.openComplaints > 0 ? (o.openComplaints >= 4 ? 'badge-danger' : 'badge-warning') : 'badge-success'}">${o.openComplaints}</span></td>
        <td>${o.wastageKg.toFixed(1)} kg</td>
        <td>${riskBadge}</td>
        <td>
          <button class="btn btn-outline btn-sm inspect-btn" data-id="${o.id}">
            Inspect <i class="fa-solid fa-arrow-right"></i>
          </button>
        </td>
      `;
      outletsTbody.appendChild(tr);
    });

    // Attach inspect click handlers
    document.querySelectorAll('.inspect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openInspector(id);
      });
    });

    // Update Overall Platform health indicator
    const criticalsCount = outlets.filter(o => o.alertStatus === 'critical').length;
    const warningsCount = outlets.filter(o => o.alertStatus === 'warning').length;

    if (criticalsCount > 0) {
      overallStatusBadge.textContent = `${criticalsCount} Critical Alert Outlets Active`;
      overallStatusBadge.className = 'badge badge-danger';
    } else if (warningsCount > 0) {
      overallStatusBadge.textContent = `${warningsCount} Outlets with Warning flags`;
      overallStatusBadge.className = 'badge badge-warning';
    } else {
      overallStatusBadge.textContent = 'All 40 Outlets Normal & Compliant';
      overallStatusBadge.className = 'badge badge-success';
    }
  }

  // Bind Search box
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderOutletsTable();
  });

  // Bind City Filters buttons
  cityFilters.querySelectorAll('.ticket-btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      cityFilters.querySelector('.ticket-btn-filter.active').classList.remove('active');
      btn.classList.add('active');
      activeCityFilter = btn.getAttribute('data-city');
      renderOutletsTable();
    });
  });

  // ==========================================
  // 2. Inspector Drawer Overlay Control
  // ==========================================

  function openInspector(outletId) {
    selectedOutletId = outletId;
    const outlets = Database.getOutlets();
    const target = outlets.find(o => o.id === outletId);
    if (!target) return;

    inspectOutletId.textContent = target.id;
    inspectOutletName.textContent = target.name;
    inspectManager.textContent = target.manager;
    inspectSales.textContent = `₹${target.sales.toLocaleString('en-IN')}`;
    inspectOrders.textContent = target.orders;
    inspectHygiene.textContent = `${target.hygieneScore}%`;
    inspectWastage.textContent = `${target.wastageKg.toFixed(1)} kg`;
    inspectComplaintsCount.textContent = target.openComplaints;

    // Apply risk badge
    inspectRiskBadge.textContent = target.alertStatus.toUpperCase();
    if (target.alertStatus === 'critical') inspectRiskBadge.className = 'badge badge-danger';
    else if (target.alertStatus === 'warning') inspectRiskBadge.className = 'badge badge-warning';
    else inspectRiskBadge.className = 'badge badge-success';

    // Fetch and display active complaints list for this outlet
    const tickets = Database.getTickets();
    const outletTickets = tickets.filter(t => t.outletId === outletId && t.status !== 'Resolved');
    inspectTicketsList.innerHTML = '';

    if (outletTickets.length === 0) {
      inspectTicketsList.innerHTML = `
        <div style="font-size: 11px; text-align:center; padding: 10px; color: var(--text-muted);">
          <i class="fa-solid fa-face-smile text-green"></i> No active complaint tickets for this branch.
        </div>
      `;
    } else {
      outletTickets.forEach(t => {
        const ticketEl = document.createElement('div');
        ticketEl.className = 'ai-alert-item warning';
        ticketEl.style.padding = '10px';
        ticketEl.style.cursor = 'pointer';
        ticketEl.onclick = () => {
          window.location.href = `crm.html?search=${t.id}`;
        };
        ticketEl.innerHTML = `
          <div class="alert-body">
            <h4 style="display:flex; justify-content:space-between;">
              <span><strong>${t.id}</strong> [${t.category}]</span>
              <span style="color:var(--danger);">${t.priority}</span>
            </h4>
            <p style="font-size:11px; margin-top:4px;">${t.description}</p>
          </div>
        `;
        inspectTicketsList.appendChild(ticketEl);
      });
    }

    // Wire operations buttons to deep links
    inspectActionAudit.onclick = () => {
      window.location.href = `compliance.html?outletId=${target.id}`;
    };
    inspectActionComplaint.onclick = () => {
      window.location.href = `crm.html?outletId=${target.id}`;
    };

    // Open Drawer
    inspectorOverlay.classList.add('open');
    overlayBg.classList.add('show');
  }

  function closeInspector() {
    inspectorOverlay.classList.remove('open');
    overlayBg.classList.remove('show');
    selectedOutletId = null;
  }

  overlayCloseBtn.addEventListener('click', closeInspector);
  overlayBg.addEventListener('click', closeInspector);

  // ==========================================
  // 3. Deep Linking Initialization
  // ==========================================

  function checkDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      searchInput.value = searchParam;
      searchQuery = searchParam;
      renderOutletsTable();

      // If it's a specific outlet ID, open the inspector drawer automatically!
      if (searchParam.startsWith('OUT-')) {
        openInspector(searchParam);
      }
    } else {
      renderOutletsTable();
    }
  }

  // Run on startup
  checkDeepLink();

});
