/* ==========================================================================
   Martinoz Franchise Intelligence Platform - Forecasting Logic (forecasting.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Database === 'undefined') {
    console.error('Database mock library data.js is not loaded.');
    return;
  }

  // --- Element Bindings ---
  const outletSelect = document.getElementById('forecaster-outlet-select');
  const inputDay = document.getElementById('input-day');
  const labelDay = document.getElementById('label-day');
  const inputWeather = document.getElementById('input-weather');
  const labelWeather = document.getElementById('label-weather');
  const inputHoliday = document.getElementById('input-holiday');
  const inputPromo = document.getElementById('input-promo');

  const qtyPizza = document.getElementById('qty-pizza');
  const qtySides = document.getElementById('qty-sides');
  const qtyBeverage = document.getElementById('qty-beverage');
  const prepPeakHour = document.getElementById('prep-peak-hour');
  
  const prepListContainer = document.getElementById('prep-list-container');

  // --- Translations Map ---
  const DAYS_MAP = {
    1: { name: 'Monday (Low)', multiplier: 0.8 },
    2: { name: 'Tuesday (Low)', multiplier: 0.85 },
    3: { name: 'Wednesday (Normal)', multiplier: 1.0 },
    4: { name: 'Thursday (Normal)', multiplier: 0.95 },
    5: { name: 'Friday (High)', multiplier: 1.3 },
    6: { name: 'Saturday (Peak)', multiplier: 1.6 },
    7: { name: 'Sunday (Peak)', multiplier: 1.5 }
  };

  const WEATHER_MAP = {
    1: { name: 'Clear / Cool (Normal)', pizzaMult: 1.0, bevMult: 0.9 },
    2: { name: 'Rainy / Monsoon (+Beverages)', pizzaMult: 1.05, bevMult: 1.25 },
    3: { name: 'Severe Hot (+Beverages)', pizzaMult: 0.9, bevMult: 1.45 }
  };

  // ==========================================
  // 1. Initialize Outlet Select List
  // ==========================================
  
  function initOutletSelect() {
    const outlets = Database.getOutlets();
    outletSelect.innerHTML = '';
    
    outlets.forEach(o => {
      const option = document.createElement('option');
      option.value = o.id;
      option.textContent = `${o.name} (${o.city})`;
      outletSelect.appendChild(option);
    });

    // Support deep link pre-selection if present in query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const outletParam = urlParams.get('outletId');
    if (outletParam) {
      outletSelect.value = outletParam;
    }

    calculateForecast();
  }

  // ==========================================
  // 2. Calculations Engine
  // ==========================================

  function calculateForecast() {
    const outlets = Database.getOutlets();
    const selectedId = outletSelect.value;
    const outlet = outlets.find(o => o.id === selectedId);
    if (!outlet) return;

    // Read Input Values
    const dayVal = parseInt(inputDay.value);
    const weatherVal = parseInt(inputWeather.value);
    const holidayActive = inputHoliday.checked;
    const promoActive = inputPromo.checked;

    // Apply labels
    labelDay.textContent = DAYS_MAP[dayVal].name;
    labelWeather.textContent = WEATHER_MAP[weatherVal].name;

    // Base Orders derived from outlet historical stats
    const baseOrders = outlet.orders;

    // Factors
    const dayMult = DAYS_MAP[dayVal].multiplier;
    const weatherPizzaMult = WEATHER_MAP[weatherVal].pizzaMult;
    const weatherBevMult = WEATHER_MAP[weatherVal].bevMult;
    const holidayMult = holidayActive ? 1.25 : 1.0;
    const promoMult = promoActive ? 1.30 : 1.0;

    // Calculations
    const finalPizzaCount = Math.round(baseOrders * dayMult * weatherPizzaMult * holidayMult * promoMult);
    const finalSidesCount = Math.round(finalPizzaCount * 0.45);
    const finalBevCount = Math.round(finalPizzaCount * 0.8 * weatherBevMult);

    // Update Output Numbers
    qtyPizza.textContent = finalPizzaCount;
    qtySides.textContent = finalSidesCount;
    qtyBeverage.textContent = finalBevCount;

    // Peak Hour logic
    if (dayVal >= 5) {
      prepPeakHour.textContent = 'Peak Shift: 6:30 PM - 10:30 PM';
    } else {
      prepPeakHour.textContent = 'Peak Shift: 7:00 PM - 9:30 PM';
    }

    // Render Prep Checklist
    renderPrepChecklist(finalPizzaCount, finalSidesCount);
  }

  // ==========================================
  // 3. Prep Checklist Renderer
  // ==========================================

  function renderPrepChecklist(pizzaCount, sidesCount) {
    prepListContainer.innerHTML = '';

    // Calculate Ingredients based on ratios
    const doughBalls = pizzaCount + Math.ceil(pizzaCount * 0.15); // +15% buffer
    const cheeseKg = (pizzaCount * 0.14).toFixed(1); // 140g per pizza
    const sauceLiters = (pizzaCount * 0.12).toFixed(1); // 120ml per pizza
    const pepperoniKg = (pizzaCount * 0.05).toFixed(1); // 50g per pizza
    const veggiesKg = (pizzaCount * 0.08).toFixed(1); // 80g per pizza
    const garlicButterLiters = (sidesCount * 0.06).toFixed(1); // 60ml per garlic bread

    const prepItems = [
      { label: 'Slow-Fermented Dough Portions (12")', qty: `${doughBalls} units`, desc: '48h double fermentation room-temp dough' },
      { label: 'Artisanal Mozzarella Cheese (Shredded)', qty: `${cheeseKg} kg`, desc: 'Keep refrigerated under 4°C' },
      { label: 'San Marzano Pizza Sauce Base', qty: `${sauceLiters} L`, desc: 'Double check acidity and basil content' },
      { label: 'Premium Cured Pepperoni Slices', qty: `${pepperoniKg} kg`, desc: 'Ensure slice thickness is exactly 1.8mm' },
      { label: 'Assorted Fresh Chopped Veggies', qty: `${veggiesKg} kg`, desc: 'Onions, Bell peppers, Mushrooms, Olives' },
      { label: 'Garlic Herb Butter Spread', qty: `${garlicButterLiters} L`, desc: 'Melted and kept warm for garlic bread sides' }
    ];

    prepItems.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'prep-item';
      itemEl.innerHTML = `
        <div>
          <div class="prep-item-label">${item.label}</div>
          <span style="font-size:11px; color:var(--text-muted);">${item.desc}</span>
        </div>
        <div class="prep-item-qty">${item.qty}</div>
      `;
      prepListContainer.appendChild(itemEl);
    });
  }

  // ==========================================
  // 4. Attach Listeners
  // ==========================================

  outletSelect.addEventListener('change', calculateForecast);
  inputDay.addEventListener('input', calculateForecast);
  inputWeather.addEventListener('input', calculateForecast);
  inputHoliday.addEventListener('change', calculateForecast);
  inputPromo.addEventListener('change', calculateForecast);

  // Run on load
  initOutletSelect();

});
