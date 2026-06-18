/* ==========================================================================
   Martinoz Franchise Intelligence Platform - Hygiene Compliance Logic (compliance.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Database === 'undefined') {
    console.error('Database mock library data.js is not loaded.');
    return;
  }

  // --- Element Bindings ---
  const auditOutletSelect = document.getElementById('audit-outlet-select');
  const checklistForm = document.getElementById('audit-checklist-form');
  const checklistCheckboxes = document.querySelectorAll('.audit-checkbox');
  const gaugeScoreValue = document.getElementById('gauge-score-value');
  const gaugeStatusBadge = document.getElementById('gauge-status-badge');

  // ==========================================
  // 1. Initialize Outlet Select List
  // ==========================================

  function initOutletSelect() {
    const outlets = Database.getOutlets();
    auditOutletSelect.innerHTML = '';

    outlets.forEach(o => {
      const option = document.createElement('option');
      option.value = o.id;
      option.textContent = `${o.name} (${o.city}) — Current Score: ${o.hygieneScore}%`;
      auditOutletSelect.appendChild(option);
    });

    // Check deep link parameter
    const urlParams = new URLSearchParams(window.location.search);
    const outletParam = urlParams.get('outletId');
    if (outletParam) {
      auditOutletSelect.value = outletParam;
    }

    // Initial load for active outlet
    loadOutletChecklistState();
  }

  // ==========================================
  // 2. Load Checkboxes based on current score
  // ==========================================

  function loadOutletChecklistState() {
    const outlets = Database.getOutlets();
    const selectedId = auditOutletSelect.value;
    const outlet = outlets.find(o => o.id === selectedId);
    if (!outlet) return;

    const score = outlet.hygieneScore;

    // Standard pre-selection distribution
    checklistCheckboxes.forEach(checkbox => {
      const weight = parseInt(checkbox.getAttribute('data-weight'));
      
      // If score is 100, check all.
      // If score is 95, uncheck FSSAI license (10) or temp logs (25), etc.
      // We simulate by sorting weights and checking them until we meet the score.
      if (score >= 95) {
        checkbox.checked = true;
      } else if (score >= 85) {
        // Uncheck lowest weight (10)
        checkbox.checked = weight > 10;
      } else if (score >= 75) {
        // Uncheck expiry logs (20)
        checkbox.checked = weight !== 20;
      } else {
        // Uncheck critical components
        checkbox.checked = weight === 25 || weight === 15 || weight === 10;
      }
    });

    calculateScoreLive();
  }

  // ==========================================
  // 3. Live Score Estimation Calculations
  // ==========================================

  function calculateScoreLive() {
    let score = 0;

    checklistCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        score += parseInt(checkbox.getAttribute('data-weight'));
      }
    });

    // Update gauge UI
    gaugeScoreValue.textContent = `${score}%`;

    // Border color adjustment
    if (score >= 85) {
      gaugeScoreValue.style.borderTopColor = 'var(--success)';
      gaugeScoreValue.style.borderRightColor = 'var(--success)';
      gaugeScoreValue.style.borderBottomColor = 'var(--success)';
      gaugeScoreValue.style.borderLeftColor = 'var(--success)';
      gaugeStatusBadge.textContent = 'Compliant Rating';
      gaugeStatusBadge.className = 'badge badge-success';
    } else if (score >= 70) {
      gaugeScoreValue.style.borderTopColor = 'var(--warning)';
      gaugeScoreValue.style.borderRightColor = 'var(--warning)';
      gaugeScoreValue.style.borderBottomColor = 'var(--border-glass)';
      gaugeScoreValue.style.borderLeftColor = 'var(--border-glass)';
      gaugeStatusBadge.textContent = 'Warning Flag';
      gaugeStatusBadge.className = 'badge badge-warning';
    } else {
      gaugeScoreValue.style.borderTopColor = 'var(--danger)';
      gaugeScoreValue.style.borderRightColor = 'var(--border-glass)';
      gaugeScoreValue.style.borderBottomColor = 'var(--border-glass)';
      gaugeScoreValue.style.borderLeftColor = 'var(--border-glass)';
      gaugeStatusBadge.textContent = 'Critical FSSAI Risk';
      gaugeStatusBadge.className = 'badge badge-danger';
    }
  }

  // ==========================================
  // 4. Form Submission Save
  // ==========================================

  checklistForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedId = auditOutletSelect.value;
    
    let score = 0;
    checklistCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        score += parseInt(checkbox.getAttribute('data-weight'));
      }
    });

    // Save to database
    Database.submitHygieneAudit(selectedId, score);

    // Dynamic message
    alert(`HQ Compliance Registry: Audit submitted successfully!\n\nOutlet: ${selectedId}\nHygiene Compliance Score: ${score}%`);

    // Redirect to Command Center
    window.location.href = `command-center.html?search=${selectedId}`;
  });

  // Attach event listeners
  auditOutletSelect.addEventListener('change', loadOutletChecklistState);
  checklistCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', calculateScoreLive);
  });

  // Start
  initOutletSelect();

});
