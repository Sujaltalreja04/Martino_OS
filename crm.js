/* ==========================================================================
   Martinoz Franchise Intelligence Platform - Complaint CRM Logic (crm.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Database === 'undefined') {
    console.error('Database mock library data.js is not loaded.');
    return;
  }

  // --- Element Bindings ---
  const ticketsScroller = document.getElementById('crm-tickets-scroller');
  const detailsPane = document.getElementById('crm-details-pane');
  const filtersGroup = document.getElementById('crm-ticket-filters');

  // Modal Dialog Elements
  const modalOverlay = document.getElementById('crm-modal-overlay');
  const openModalBtn = document.getElementById('crm-open-modal-btn');
  const closeModalBtn = document.getElementById('crm-close-modal-btn');
  const cancelBtn = document.getElementById('form-cancel-btn');
  const formOutletSelect = document.getElementById('form-outlet-select');
  const newTicketForm = document.getElementById('crm-new-ticket-form');

  let activeFilter = 'active'; // 'active', 'Resolved', 'all'
  let selectedTicketId = null;

  // ==========================================
  // 1. Initialize Log Form Dropdown List
  // ==========================================

  function initOutletFormDropdown() {
    const outlets = Database.getOutlets();
    formOutletSelect.innerHTML = '';
    
    outlets.forEach(o => {
      const option = document.createElement('option');
      option.value = o.id;
      option.textContent = `${o.name} (${o.city})`;
      formOutletSelect.appendChild(option);
    });
  }

  initOutletFormDropdown();

  // ==========================================
  // 2. Render Left Hand Ticket Listing
  // ==========================================

  function renderTicketsList() {
    ticketsScroller.innerHTML = '';
    const tickets = Database.getTickets();

    const filteredTickets = tickets.filter(t => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'Resolved') return t.status === 'Resolved';
      // active
      return t.status === 'Open' || t.status === 'Escalated';
    });

    if (filteredTickets.length === 0) {
      ticketsScroller.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px;">
          <i class="fa-solid fa-folder-open" style="font-size:24px; margin-bottom:10px;"></i>
          <p>No tickets in this folder.</p>
        </div>
      `;
      return;
    }

    filteredTickets.forEach(t => {
      const isSelected = t.id === selectedTicketId;
      const card = document.createElement('div');
      card.className = `ticket-card-item ${isSelected ? 'selected' : ''}`;
      card.setAttribute('data-id', t.id);

      // Priority classes
      let priorityBadgeClass = 'badge-info';
      if (t.priority === 'Critical') priorityBadgeClass = 'badge-danger';
      else if (t.priority === 'High') priorityBadgeClass = 'badge-warning';

      // Status tags
      let statusBadge = `<span class="badge ${t.status === 'Resolved' ? 'badge-success' : (t.status === 'Escalated' ? 'badge-danger' : 'badge-warning')}">${t.status}</span>`;

      // SLA display
      let slaText = `<span class="sla-tag"><i class="fa-regular fa-clock"></i> SLA: ${t.slaHours}h</span>`;
      if (t.status === 'Resolved') {
        slaText = `<span style="color:var(--text-muted);"><i class="fa-regular fa-circle-check"></i> Closed</span>`;
      }

      card.innerHTML = `
        <div class="ticket-card-header">
          <span class="ticket-id">${t.id}</span>
          ${statusBadge}
        </div>
        <div class="ticket-card-body">
          <h4>${t.outletName}</h4>
          <p>${t.description}</p>
        </div>
        <div class="ticket-card-footer">
          <span class="badge ${priorityBadgeClass}">${t.priority}</span>
          ${slaText}
        </div>
      `;

      card.addEventListener('click', () => {
        selectTicket(t.id);
      });

      ticketsScroller.appendChild(card);
    });
  }

  // ==========================================
  // 3. Render Right Hand Inspect Pane
  // ==========================================

  function selectTicket(ticketId) {
    selectedTicketId = ticketId;
    
    // Highlight item in left list
    document.querySelectorAll('.ticket-card-item').forEach(card => {
      card.classList.toggle('selected', card.getAttribute('data-id') === ticketId);
    });

    renderTicketDetails();
  }

  function renderTicketDetails() {
    if (!selectedTicketId) {
      detailsPane.innerHTML = `
        <div class="empty-details-state">
          <i class="fa-solid fa-clipboard-question"></i>
          <h3>No Ticket Selected</h3>
          <p style="font-size:12px; color:var(--text-secondary); margin-top:8px;">Select an active complaint ticket from the registry list to investigate description, outlet metrics, and execute resolution workflows.</p>
        </div>
      `;
      return;
    }

    const tickets = Database.getTickets();
    const t = tickets.find(ticket => ticket.id === selectedTicketId);
    if (!t) {
      selectedTicketId = null;
      renderTicketDetails();
      return;
    }

    // Fetch outlet metadata
    const outlets = Database.getOutlets();
    const outlet = outlets.find(o => o.id === t.outletId);

    // Status visual
    let statusClass = 'badge-warning';
    if (t.status === 'Resolved') statusClass = 'badge-success';
    if (t.status === 'Escalated') statusClass = 'badge-danger';

    // Show action buttons if not resolved
    let actionButtons = '';
    if (t.status !== 'Resolved') {
      actionButtons = `
        <div class="ticket-actions-group">
          <button class="btn btn-outline" id="btn-escalate-ticket" ${t.status === 'Escalated' ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-up-right-dots text-orange"></i> Escalate Urgency
          </button>
          <button class="btn btn-primary" id="btn-resolve-ticket" style="background:var(--success);">
            <i class="fa-solid fa-check"></i> Mark Resolved
          </button>
        </div>
      `;
    }

    detailsPane.innerHTML = `
      <div class="card-header" style="padding-bottom:12px; margin-bottom:18px;">
        <h3><i class="fa-solid fa-eye text-orange"></i> Inspect Ticket: ${t.id}</h3>
        <span class="badge ${statusClass}">${t.status}</span>
      </div>

      <!-- Ticket Metadata Grid -->
      <div class="ticket-info-grid">
        <div class="info-field">
          <h5>Outlet Name</h5>
          <p>${t.outletName} (${outlet ? outlet.city : 'N/A'})</p>
        </div>
        <div class="info-field">
          <h5>Branch Manager</h5>
          <p>${outlet ? outlet.manager : 'N/A'}</p>
        </div>
        <div class="info-field">
          <h5>Category</h5>
          <p>${t.category}</p>
        </div>
        <div class="info-field">
          <h5>Priority Severity</h5>
          <p><span class="badge ${t.priority === 'Critical' ? 'badge-danger' : (t.priority === 'High' ? 'badge-warning' : 'badge-info')}">${t.priority}</span></p>
        </div>
        <div class="info-field">
          <h5>Date Created</h5>
          <p>${new Date(t.dateCreated).toLocaleString()}</p>
        </div>
        <div class="info-field">
          <h5>SLA Resolution Target</h5>
          <p>${t.status === 'Resolved' ? 'Closed' : `${t.slaHours} hours`}</p>
        </div>
      </div>

      <!-- Ticket Description -->
      <h5 style="font-size:11px; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">Customer Complaint Description</h5>
      <div class="ticket-desc-box">
        ${t.description}
      </div>

      <!-- Outlets current indicators -->
      <div class="overlay-grid" style="margin-bottom: 24px;">
        <div class="overlay-metric">
          <h5>Outlet hygiene</h5>
          <p>${outlet ? outlet.hygieneScore : 0}%</p>
        </div>
        <div class="overlay-metric">
          <h5>Active complaints</h5>
          <p>${outlet ? outlet.openComplaints : 0}</p>
        </div>
      </div>

      <!-- Action Panel -->
      ${actionButtons}
    `;

    // Bind Action buttons events
    const btnResolve = document.getElementById('btn-resolve-ticket');
    const btnEscalate = document.getElementById('btn-escalate-ticket');

    if (btnResolve) {
      btnResolve.addEventListener('click', () => {
        Database.resolveTicket(t.id);
        renderTicketsList();
        renderTicketDetails();
      });
    }

    if (btnEscalate) {
      btnEscalate.addEventListener('click', () => {
        Database.escalateTicket(t.id);
        renderTicketsList();
        renderTicketDetails();
      });
    }
  }

  // Bind Left Filter Headers
  filtersGroup.querySelectorAll('.ticket-btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersGroup.querySelector('.ticket-btn-filter.active').classList.remove('active');
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-status');
      renderTicketsList();
    });
  });

  // ==========================================
  // 4. Modal Dialog Controller
  // ==========================================

  function openModal() {
    modalOverlay.classList.add('open');
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    newTicketForm.reset();
  }

  openModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Submit New complaint
  newTicketForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const outletId = document.getElementById('form-outlet-select').value;
    const category = document.getElementById('form-category-select').value;
    const priority = document.getElementById('form-priority-select').value;
    const description = document.getElementById('form-desc-textarea').value;

    const newTicket = Database.addTicket({ outletId, category, priority, description });
    
    closeModal();
    
    // Switch filter to active list to see it
    filtersGroup.querySelector('.ticket-btn-filter.active').classList.remove('active');
    filtersGroup.querySelector('[data-status="active"]').classList.add('active');
    activeFilter = 'active';
    
    renderTicketsList();
    selectTicket(newTicket.id);

    // Scroll card into view
    const newCard = document.querySelector(`.ticket-card-item[data-id="${newTicket.id}"]`);
    if (newCard) {
      newCard.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ==========================================
  // 5. Deep Linking & URL Parameters
  // ==========================================

  function checkDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search'); // Ticket ID e.g., TCK-101
    const outletParam = urlParams.get('outletId'); // Outlet ID pre-selection e.g., OUT-04

    if (searchParam) {
      // Find ticket and select it
      const tickets = Database.getTickets();
      const target = tickets.find(t => t.id === searchParam);
      if (target) {
        // Change filter mode depending on ticket status
        filtersGroup.querySelector('.ticket-btn-filter.active').classList.remove('active');
        if (target.status === 'Resolved') {
          filtersGroup.querySelector('[data-status="Resolved"]').classList.add('active');
          activeFilter = 'Resolved';
        } else {
          filtersGroup.querySelector('[data-status="active"]').classList.add('active');
          activeFilter = 'active';
        }
        renderTicketsList();
        selectTicket(target.id);
        
        setTimeout(() => {
          const card = document.querySelector(`.ticket-card-item[data-id="${target.id}"]`);
          if (card) card.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (outletParam) {
      // Pre-select outlet inside form and open modal immediately
      formOutletSelect.value = outletParam;
      renderTicketsList();
      openModal();
    } else {
      renderTicketsList();
    }
  }

  // Run on start
  checkDeepLink();

});
