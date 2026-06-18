/* ==========================================================================
   Martinoz Franchise Intelligence Platform - SKU Dashboard Logic (sku-dashboard.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Check database connected
  if (typeof Database === 'undefined') {
    console.error('Database mock library data.js is not loaded.');
    return;
  }

  // --- Element Bindings ---
  const statLostSales = document.getElementById('stat-lost-sales');
  const statWastageRisk = document.getElementById('stat-wastage-risk');
  const statAlignmentScore = document.getElementById('stat-alignment-score');
  const statMismatchAlerts = document.getElementById('stat-mismatch-alerts');

  const progressLostSales = document.getElementById('progress-lost-sales');
  const progressWastageRisk = document.getElementById('progress-wastage-risk');
  const progressAlignment = document.getElementById('progress-alignment');
  const progressAlerts = document.getElementById('progress-alerts');

  const filterMismatchType = document.getElementById('filter-mismatch-type');
  const filterSkuOutlet = document.getElementById('filter-sku-outlet');
  const skuMismatchTbody = document.getElementById('sku-mismatch-tbody');
  
  const chartLocationBadge = document.getElementById('chart-location-badge');
  const chartCanvas = document.getElementById('sku-comparison-chart');

  // Promos Bindings
  const promoCodeInput = document.getElementById('promo-code-input');
  const promoDiscountInput = document.getElementById('promo-discount-input');
  const btnCreatePromo = document.getElementById('btn-create-promo');
  const promosTbody = document.getElementById('promos-tbody');

  let currentChart = null;

  // ==========================================================================
  // 1. Dashboard Initializer
  // ==========================================================================

  function initSkuDashboard() {
    populateOutletFilters();
    
    // Listeners for dropdowns
    filterMismatchType.addEventListener('change', reloadDashboard);
    filterSkuOutlet.addEventListener('change', reloadDashboard);

    setupPromotionsListeners();
    renderPromotionsList();

    // Initial load
    reloadDashboard();
  }

  function populateOutletFilters() {
    const outlets = Database.getOutlets();
    // Sort outlets alphabetically by name
    outlets.sort((a, b) => a.name.localeCompare(b.name));
    
    outlets.forEach(o => {
      const option = document.createElement('option');
      option.value = o.id;
      option.textContent = o.name;
      filterSkuOutlet.appendChild(option);
    });
  }

  function reloadDashboard() {
    const stats = Database.getInventoryStats();
    const inventory = Database.getInventory();
    const skus = Database.getSkus();
    const outlets = Database.getOutlets();

    const selectedOutletId = filterSkuOutlet.value;
    const selectedMismatchType = filterMismatchType.value;

    // 1. Render Top Statistics & Progress Bars
    renderTopStats(stats);

    // 2. Filter Inventory list for the Table
    let tableData = inventory.map(item => {
      const sku = skus.find(s => s.id === item.skuId) || { name: 'Unknown SKU', price: 0 };
      const outlet = outlets.find(o => o.id === item.outletId) || { name: 'Unknown Outlet' };
      const diff = item.stock - item.demand;
      
      let type = 'aligned';
      let financialImpact = 0;
      if (diff < 0) {
        type = 'stockout';
        financialImpact = Math.abs(diff) * sku.price;
      } else if (diff > 0) {
        type = 'overstock';
        financialImpact = diff * sku.price;
      }

      return {
        ...item,
        skuName: sku.name,
        skuPrice: sku.price,
        outletName: outlet.name,
        diff,
        type,
        financialImpact
      };
    });

    // Apply Table Filters
    if (selectedOutletId !== 'all') {
      tableData = tableData.filter(item => item.outletId === selectedOutletId);
    }
    if (selectedMismatchType !== 'all') {
      tableData = tableData.filter(item => item.type === selectedMismatchType);
    }

    // Render Table Rows
    renderMismatchTable(tableData);

    // Render Promotions
    renderPromotionsList();

    // 3. Render Chart comparison
    renderStockChart(inventory, skus, selectedOutletId, outlets);
  }

  // ==========================================================================
  // 2. Statistics & Table Renders
  // ==========================================================================

  function renderTopStats(stats) {
    statLostSales.textContent = `₹${stats.totalLostSales.toLocaleString('en-IN')}`;
    statWastageRisk.textContent = `₹${stats.totalWastageVal.toLocaleString('en-IN')}`;
    statAlignmentScore.textContent = `${stats.alignmentScore}%`;
    statMismatchAlerts.textContent = stats.totalAlerts;

    // Targets for progress calculations
    const lostSalesCap = 100000;
    const wastageRiskCap = 100000;
    const alertsCap = 10;

    const lostSalesPct = Math.min((stats.totalLostSales / lostSalesCap) * 100, 100);
    const wastagePct = Math.min((stats.totalWastageVal / wastageRiskCap) * 100, 100);
    const alignmentPct = stats.alignmentScore;
    const alertsPct = Math.min((stats.totalAlerts / alertsCap) * 100, 100);

    if (progressLostSales) progressLostSales.style.width = `${lostSalesPct}%`;
    if (progressWastageRisk) progressWastageRisk.style.width = `${wastagePct}%`;
    if (progressAlignment) progressAlignment.style.width = `${alignmentPct}%`;
    if (progressAlerts) progressAlerts.style.width = `${alertsPct}%`;
  }

  function renderMismatchTable(items) {
    skuMismatchTbody.innerHTML = '';

    if (items.length === 0) {
      skuMismatchTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
            <i class="fa-solid fa-circle-check text-success-green"></i> No active stock mismatches found matching filters.
          </td>
        </tr>
      `;
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      
      let statusBadge = '<span class="badge badge-success">Aligned</span>';
      let impactText = '₹0';
      let actionBtn = '<span style="color:var(--text-muted); font-size:11px;">No action needed</span>';

      if (item.type === 'stockout') {
        statusBadge = '<span class="badge badge-danger">Stockout Risk</span>';
        impactText = `<span class="text-danger-red">₹${item.financialImpact.toLocaleString('en-IN')} (lost)</span>`;
        actionBtn = `
          <button class="action-btn-sm btn-reorder" data-id="${item.id}" title="Restock item to meet demand">
            <i class="fa-solid fa-truck-ramp-box"></i> Restock
          </button>
        `;
      } else if (item.type === 'overstock') {
        statusBadge = '<span class="badge badge-warning">Overstock</span>';
        impactText = `<span class="text-warning-gold">₹${item.financialImpact.toLocaleString('en-IN')} (spoilage)</span>`;
        actionBtn = `
          <button class="action-btn-sm btn-discount" data-id="${item.id}" title="Clear stock using targeted promos">
            <i class="fa-solid fa-tags"></i> Discount
          </button>
        `;
      }

      tr.innerHTML = `
        <td><strong>${item.outletName}</strong></td>
        <td>${item.skuName}</td>
        <td>${item.stock} units</td>
        <td>${item.demand} units</td>
        <td>${impactText}</td>
        <td>${actionBtn}</td>
      `;

      skuMismatchTbody.appendChild(tr);
    });

    // Bind action events
    skuMismatchTbody.querySelectorAll('.btn-reorder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const invId = e.currentTarget.getAttribute('data-id');
        executeRestock(invId);
      });
    });

    skuMismatchTbody.querySelectorAll('.btn-discount').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const invId = e.currentTarget.getAttribute('data-id');
        executeDiscount(invId);
      });
    });
  }

  // ==========================================
  // 3. Action Executers
  // ==========================================

  function executeRestock(invId) {
    const inventory = Database.getInventory();
    const record = inventory.find(item => item.id === invId);
    if (record) {
      // Stock up to meet full projected demand
      record.stock = record.demand;
      Database.saveInventory(inventory);
      
      // Update global UI stats in notification bell
      const stats = Database.getGlobalStats();
      document.getElementById('header-notif-count').textContent = stats.openComplaints;
      
      reloadDashboard();
    }
  }

  function executeDiscount(invId) {
    const inventory = Database.getInventory();
    const record = inventory.find(item => item.id === invId);
    if (record) {
      // Clear excess stock using promos to match demand (discount execution)
      record.stock = record.demand;
      Database.saveInventory(inventory);
      
      reloadDashboard();
    }
  }

  // ==========================================
  // 4. Comparative Chart.js Visualizer
  // ==========================================

  function renderStockChart(inventory, skus, selectedOutletId, outlets) {
    const ctx = chartCanvas.getContext('2d');
    
    if (currentChart) {
      currentChart.destroy();
    }

    // Determine target location label
    let targetLocationName = 'All Territories';
    if (selectedOutletId !== 'all') {
      const matched = outlets.find(o => o.id === selectedOutletId);
      if (matched) targetLocationName = matched.name;
    }
    chartLocationBadge.textContent = targetLocationName;

    // Filter items based on selected outlet
    const filteredInv = selectedOutletId === 'all'
      ? inventory
      : inventory.filter(item => item.outletId === selectedOutletId);

    // Aggregate stock and demand per SKU
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

    // Instantiate side-by-side vertical bar chart
    const gradientStock = ctx.createLinearGradient(0, 0, 0, 300);
    gradientStock.addColorStop(0, 'rgba(0, 180, 216, 0.85)');
    gradientStock.addColorStop(1, 'rgba(0, 180, 216, 0.15)');

    const gradientDemand = ctx.createLinearGradient(0, 0, 0, 300);
    gradientDemand.addColorStop(0, 'rgba(255, 107, 53, 0.85)');
    gradientDemand.addColorStop(1, 'rgba(255, 107, 53, 0.15)');

    currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: skuLabels,
        datasets: [
          {
            label: 'Available Stock (Units)',
            data: stockData,
            backgroundColor: gradientStock,
            borderColor: 'rgba(0, 180, 216, 1)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Projected Demand (Units)',
            data: demandData,
            backgroundColor: gradientDemand,
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
            labels: {
              color: '#9ea8b6',
              font: { family: 'Inter', size: 10 }
            }
          },
          tooltip: {
            backgroundColor: '#0c0e12',
            titleFont: { family: 'Outfit', size: 12, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 11 },
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            displayColors: true
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#f8f9fa',
              font: { family: 'Inter', size: 9 }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.08)'
            },
            ticks: {
              color: '#9ea8b6',
              font: { family: 'Inter', size: 10 }
            }
          }
        }
      }
    });
  }

  // ==========================================
  // 5. Promotions Controller Logic
  // ==========================================

  function renderPromotionsList() {
    if (!promosTbody) return;
    const promos = Database.getPromos();
    promosTbody.innerHTML = '';
    promos.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${p.code}</strong></td>
        <td>${p.discount}%</td>
        <td>${p.description}</td>
        <td><span class="badge badge-success">${p.status}</span></td>
      `;
      promosTbody.appendChild(tr);
    });
  }

  function setupPromotionsListeners() {
    if (!btnCreatePromo) return;
    btnCreatePromo.addEventListener('click', () => {
      const code = promoCodeInput.value.trim().toUpperCase();
      const discount = parseInt(promoDiscountInput.value.trim());
      if (!code || isNaN(discount) || discount <= 0 || discount > 100) {
        alert('Please enter a valid Promo Code and Discount percentage (1-100)');
        return;
      }
      const desc = `Promo: Flat ${discount}% off`;
      Database.addPromo(code, discount, desc);
      
      promoCodeInput.value = '';
      promoDiscountInput.value = '';
      renderPromotionsList();
    });
  }

  // Start the dashboard
  initSkuDashboard();

});
