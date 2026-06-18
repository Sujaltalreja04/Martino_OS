/* ==========================================================================
   Martinoz Franchise Intelligence Platform - Logistics & KDS Logic (logistics-kds.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Verify database mock library is loaded
  if (typeof Database === 'undefined') {
    console.error('Database mock library data.js is not loaded.');
    return;
  }

  // --- Element Bindings ---
  const filterKdsOutlet = document.getElementById('filter-kds-outlet');
  const filterTelemetryOutlet = document.getElementById('filter-telemetry-outlet');
  
  const kdsQueueContainer = document.getElementById('kds-queue-container');
  const kdsAvgPrep = document.getElementById('kds-avg-prep');
  const kdsTicketCount = document.getElementById('kds-ticket-count');

  const telemetryFridge = document.getElementById('telemetry-fridge');
  const telemetryOven = document.getElementById('telemetry-oven');
  const telemetryWarningBanner = document.getElementById('telemetry-warning-banner');

  const logisticsShipmentsContainer = document.getElementById('logistics-shipments-container');

  // Chart instances
  let fridgeChart = null;
  let ovenChart = null;

  // ==========================================
  // 1. Initializer
  // ==========================================

  function initLogistics() {
    populateOutletSelectors();

    // Listeners
    filterKdsOutlet.addEventListener('change', renderKdsQueue);
    filterTelemetryOutlet.addEventListener('change', renderTelemetry);

    // Initial load
    renderKdsQueue();
    renderTelemetry();
    renderShipments();
  }

  function populateOutletSelectors() {
    const outlets = Database.getOutlets();
    // Sort alphabetically by name
    outlets.sort((a, b) => a.name.localeCompare(b.name));

    outlets.forEach(o => {
      // Add option to KDS dropdown
      const optionKds = document.createElement('option');
      optionKds.value = o.id;
      optionKds.textContent = o.name;
      filterKdsOutlet.appendChild(optionKds);

      // Add option to Telemetry dropdown
      const optionTel = document.createElement('option');
      optionTel.value = o.id;
      optionTel.textContent = o.name;
      filterTelemetryOutlet.appendChild(optionTel);
    });

    // Default telemetry to Bopal OUT-05 to display the warning banner initially
    filterTelemetryOutlet.value = 'OUT-05';
  }

  // ==========================================
  // 2. KDS Queue Renderer
  // ==========================================

  function renderKdsQueue() {
    const kdsData = Database.getKds();
    const outlets = Database.getOutlets();
    const selectedOutletId = filterKdsOutlet.value;

    // Filter
    let filteredOrders = selectedOutletId === 'all'
      ? kdsData
      : kdsData.filter(o => o.outletId === selectedOutletId);

    // Sort active tickets: Preparing first, Baking second, Ready last
    const orderScore = { 'Preparing': 1, 'Baking': 2, 'Ready': 3 };
    filteredOrders.sort((a, b) => orderScore[a.status] - orderScore[b.status]);

    // Statistics
    kdsTicketCount.textContent = filteredOrders.length;
    let sumPrep = 0;
    filteredOrders.forEach(o => sumPrep += o.prepTimeMinutes);
    const avgPrep = filteredOrders.length > 0 ? Math.round(sumPrep / filteredOrders.length) : 0;
    kdsAvgPrep.textContent = `${avgPrep} mins`;

    // Render cards
    kdsQueueContainer.innerHTML = '';
    if (filteredOrders.length === 0) {
      kdsQueueContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 32px 0;">
          <i class="fa-solid fa-circle-check text-success-green" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
          No active tickets in queue.
        </div>
      `;
      return;
    }

    filteredOrders.forEach(o => {
      const outletName = outlets.find(ou => ou.id === o.outletId)?.name || 'Unknown Outlet';
      
      let badgeClass = 'badge-info';
      if (o.status === 'Preparing') badgeClass = 'badge-warning';
      if (o.status === 'Baking') badgeClass = 'badge-danger';
      if (o.status === 'Ready') badgeClass = 'badge-success';

      const card = document.createElement('div');
      card.className = 'kds-order-item';
      card.innerHTML = `
        <div class="kds-order-header">
          <div class="kds-order-customer">${o.customerName}</div>
          <span class="badge ${badgeClass}">${o.status}</span>
        </div>
        <div class="kds-order-items">${o.items}</div>
        <div class="kds-order-footer">
          <span class="kds-order-id">${o.id} | ${outletName}</span>
          <span class="kds-order-time"><i class="fa-solid fa-clock"></i> ${o.prepTimeMinutes} mins</span>
        </div>
      `;
      kdsQueueContainer.appendChild(card);
    });
  }

  // ==========================================
  // 3. IoT Telemetry Renderer
  // ==========================================

  function renderTelemetry() {
    const telemetryLogs = Database.getIot();
    const outlets = Database.getOutlets();
    const selectedOutletId = filterTelemetryOutlet.value;

    // Find live telemetry
    let activeLog = telemetryLogs.find(l => l.outletId === selectedOutletId);
    if (!activeLog) {
      // Fallback fallback defaults if no log exists
      activeLog = { outletId: selectedOutletId, fridgeTemp: 3.0, ovenTemp: 240 };
    }

    // Update numbers
    telemetryFridge.textContent = `${activeLog.fridgeTemp.toFixed(1)}°C`;
    telemetryOven.textContent = `${activeLog.ovenTemp}°C`;

    // Warnings banner check
    if (activeLog.fridgeTemp > 5.0) {
      telemetryWarningBanner.style.display = 'flex';
      telemetryFridge.className = 'telemetry-value text-danger-red';
    } else {
      telemetryWarningBanner.style.display = 'none';
      telemetryFridge.className = 'telemetry-value text-blue';
    }

    // Generate mock historical trends (last 6 hours) based on current live value
    const labels = [];
    const fridgeHistory = [];
    const ovenHistory = [];
    
    const baseHour = new Date().getHours();
    for (let i = 5; i >= 0; i--) {
      const h = (baseHour - i + 24) % 24;
      labels.push(`${h}:00`);
      
      // Calculate realistic random fluctuations
      const factor = (i === 0) ? 0 : (Math.random() - 0.5) * 0.8;
      fridgeHistory.push(parseFloat((activeLog.fridgeTemp - factor).toFixed(1)));
      ovenHistory.push(Math.round(activeLog.ovenTemp - (factor * 12)));
    }

    // Fridge Chart
    const fridgeCtx = document.getElementById('telemetry-fridge-chart').getContext('2d');
    if (fridgeChart) fridgeChart.destroy();

    const fridgeGradient = fridgeCtx.createLinearGradient(0, 0, 0, 180);
    fridgeGradient.addColorStop(0, 'rgba(0, 180, 216, 0.4)');
    fridgeGradient.addColorStop(1, 'rgba(0, 180, 216, 0)');

    fridgeChart = new Chart(fridgeCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cold Storage (°C)',
          data: fridgeHistory,
          backgroundColor: fridgeGradient,
          borderColor: '#00b4d8',
          borderWidth: 2,
          pointBackgroundColor: '#00b4d8',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#0c0e12', borderColor: '#00b4d8', borderWidth: 1 }
        },
        scales: {
          x: { ticks: { color: '#9ea8b6', font: { size: 9 } }, grid: { display: false } },
          y: { 
            ticks: { color: '#9ea8b6', font: { size: 9 } }, 
            grid: { color: 'rgba(255,255,255,0.03)' },
            suggestedMin: 1,
            suggestedMax: 7
          }
        }
      }
    });

    // Oven Chart
    const ovenCtx = document.getElementById('telemetry-oven-chart').getContext('2d');
    if (ovenChart) ovenChart.destroy();

    const ovenGradient = ovenCtx.createLinearGradient(0, 0, 0, 180);
    ovenGradient.addColorStop(0, 'rgba(255, 107, 53, 0.4)');
    ovenGradient.addColorStop(1, 'rgba(255, 107, 53, 0)');

    ovenChart = new Chart(ovenCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Baking Oven (°C)',
          data: ovenHistory,
          backgroundColor: ovenGradient,
          borderColor: '#ff6b35',
          borderWidth: 2,
          pointBackgroundColor: '#ff6b35',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#0c0e12', borderColor: '#ff6b35', borderWidth: 1 }
        },
        scales: {
          x: { ticks: { color: '#9ea8b6', font: { size: 9 } }, grid: { display: false } },
          y: { 
            ticks: { color: '#9ea8b6', font: { size: 9 } }, 
            grid: { color: 'rgba(255,255,255,0.03)' },
            suggestedMin: 200,
            suggestedMax: 270
          }
        }
      }
    });
  }

  // ==========================================
  // 4. Logistics Shipments Renderer
  // ==========================================

  function renderShipments() {
    const shipments = Database.getShipments();
    logisticsShipmentsContainer.innerHTML = '';

    shipments.forEach(s => {
      const card = document.createElement('div');
      card.className = 'shipment-item';
      
      let badgeClass = 'badge-info';
      if (s.status === 'Delivered') badgeClass = 'badge-success';
      if (s.status === 'Near Destination') badgeClass = 'badge-warning';

      card.innerHTML = `
        <div class="shipment-header">
          <div class="shipment-route"><i class="fa-solid fa-route"></i> ${s.destination}</div>
          <span class="badge ${badgeClass}">${s.status}</span>
        </div>
        <div class="shipment-cargo"><strong>Cargo:</strong> ${s.cargo}</div>
        <div class="shipment-progress-bg">
          <div class="shipment-progress-bar" style="width: ${s.progress}%;"></div>
        </div>
        <div class="shipment-footer">
          <span>Truck: ${s.id} | Driver: ${s.driver}</span>
          <strong>${s.progress}%</strong>
        </div>
      `;
      logisticsShipmentsContainer.appendChild(card);
    });
  }

  // Start the hub
  initLogistics();

});
