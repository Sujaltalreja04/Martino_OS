# Martinoz Franchise Intelligence Platform

Welcome to the **Martinoz Franchise Intelligence Platform** codebase. This project represents a unified executive operations, compliance, demand forecasting, complaint CRM, and outlet scoring platform designed for Martinoz Pizza HQ.

The application is structured as a multi-page web dashboard using HTML5, vanilla CSS3, and JavaScript, backed by a persistent data layer and an integrated AI Operations Copilot that communicates with the Groq API via a local Node.js proxy server.

---

## Centralized Features

### 1. CEO Dashboard (`index.html`)
- **Executive Metrics Panel**: Summarizes daily gross revenue, total orders count, average compliance score, and active complaint tickets across all 40+ outlets.
- **AI Executive Insights**: A feed showcasing critical compliance breaches, low hygiene score alerts, high ingredient waste detections, and forecast peaks.
- **High-Risk Outlets Checklist**: Displays branches with warnings or critical flags due to low hygiene ratings or outstanding customer complaints.
- **Franchise Standings**: A leaderboard that ranks outlets (Top 5 and Bottom 5) based on a combined score of sales, hygiene compliance, and complaint volume.

### 2. Franchise Command Center (`command-center.html`)
- **Central Outlet Registry**: An interactive listing of 40 active branches showing manager contacts, sales, orders, hygiene scores, active tickets, and waste quantities.
- **Filters & Search**: Search by outlet name/manager/ID and filter dynamically by cities (Surat, Ahmedabad, Vadodara, Navsari, Bopal, or others).
- **Inspect Drill-down Overlay**: A sliding drawer panel showcasing detailed KPIs, pending complaints, and shortcuts to audit or log tickets for the selected outlet.
- **Query Parameter Linking**: Supports deep linking (e.g. `command-center.html?search=OUT-04`) to pre-filter and open inspector panels immediately.

### 3. AI Demand Forecasting & Prep Planner (`forecasting.html`)
- **AI Simulation Control Panel**: Sliders and toggles to adjust parameters like day of the week, weather status, holidays, and active promotions.
- **Demand Output Dashboard**: Dynamic calculators showing forecasted volume for pizzas (dough portions), sides (garlic bread), and beverage containers.
- **Kitchen Smart Prep Recommendations**: Real-time recipe scaling sheet converting predicted demand into dough balls, mozzarella cheese (kg), tomato sauce (liters), and toppings.

### 4. Complaint Intelligence CRM (`crm.html`)
- **Complaint Registry Scroller**: Active/Resolved lists showing ticket ID, category, urgency severity (Low, Medium, High, Critical), and SLA countdown timers. Seeding contains the actual operational problems of the franchise (e.g., University Road cockroach incident, Bopal toothpick incident, and stomach ache claims).
- **CRM Inspect Panel**: Read description details, check branch stats, and click options to Resolve or Escalate ticket urgency. Resolving tickets dynamically decrements active complaints count on the outlet registry.
- **Register Complaint Modal**: Form to log new incidents, automatically updating global and outlet statistics. Supports deep linking (`crm.html?outletId=OUT-04`) to pre-select branches.

### 5. Hygiene & Compliance Tracker (`compliance.html`)
- **Digital Audit Form**: Daily checklists (temperature logs, staff sanitation, pest control, expiry checks, FSSAI certificates) with weighted scoring multipliers.
- **Live Score Gauge**: A visual ring that updates dynamically as requirements are ticked, indicating safe, warning, or critical risk states.
- **Commissary Expiry Alerts**: Real-time notification of commissary ingredients expiring within 48 hours.

### 6. AI Operations Copilot (`copilot.js` & `.env` via `server.js`)
- **Floating Action Chat Trigger**: Available on the bottom-right of every platform page. Slides open a responsive, glassmorphic chat interface.
- **Live Data Context Extraction**: Automatically compiles the current database metrics (revenue, orders, hygiene scores, complaints count, specific branch risk alerts, active crm tickets) and wraps them inside the LLM prompt context.
- **Node.js Proxy Integration**: Routes chat requests through a local Node.js server to run queries using the Groq Llama-4 model (`meta-llama/llama-4-scout-17b-16e-instruct`). This resolves the browser CORS limitation and secures the API credential in an environment file.
- **Natural Language Capabilities**: Answers complex queries such as:
  - *"What is our total revenue today?"*
  - *"Which outlets are at critical risk?"*
  - *"How many unresolved complaints are open?"*
  - *"What is the hygiene score of Bopal Crossroad?"*
  - *"What should I prep for Surat Ring Road tomorrow?"*

---

## System Architecture & File Structure

- [index.html](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/index.html): CEO Dashboard page.
- [command-center.html](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/command-center.html): Franchise Command Center list view.
- [forecasting.html](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/forecasting.html): Demand forecasting inputs and prep planner.
- [crm.html](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/crm.html): Tickets registry and detail viewer.
- [compliance.html](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/compliance.html): Hygiene checklist and gauge.
- [styles.css](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/styles.css): Shared design system, dark-mode layouts, drawers, badges, and sliders.
- [data.js](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/data.js): Persistent database layer managing 40 seeded outlets and 10 tickets, syncing modifications across pages via `localStorage`.
- [copilot.js](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/copilot.js): Floating chat launcher UI and real-time operations database prompt context compiler.
- [dashboard.js](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/dashboard.js): CEO Dashboard stats aggregations and leaderboards.
- [command-center.js](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/command-center.js): Outlets registry listing, search filtering, and inspector drawer.
- [forecasting.js](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/forecasting.js): Weather/day multiplier calculators and prep checklist.
- [crm.js](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/crm.js): Ticket statuses, resolutions, and logs.
- [compliance.js](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/compliance.js): Live score checklists and audits.
- [server.js](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/server.js): Lightweight Node.js server serving static assets and proxying requests securely to Groq completions endpoint.
- [.env](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/.env): Local environment file holding `GROQ_API_KEY`.
- [hero_pizza.png](file:///c:/Users/sujal/OneDrive/Desktop/Martinoz%20Pizza/hero_pizza.png): Premium visual banner.

---

## Instructions to Run and Validate

1. Seed the environment file `.env` with your Groq credential:
   ```env
   GROQ_API_KEY=your_key_here
   ```
2. Start the Node.js server:
   ```bash
   node server.js
   ```
3. Open your web browser and navigate to:
   ```
   http://localhost:8000
   ```
4. Click the floating **FIP Copilot** button at the bottom-right of the screen and query the operations assistant in natural language!
