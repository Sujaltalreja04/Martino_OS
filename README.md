# 🍕 Martinoz Franchise Intelligence Platform (FIP)

Welcome to the **Martinoz Franchise Intelligence Platform (FIP)**—a futuristic, real-time control room and decision-support suite designed for corporate executives and outlet managers of Martinoz Pizza.

FIP combines edge IoT telemetry (freezer/oven sensors), Point-of-Sale (POS) event streams, external weather monitoring (CNN monsoon/heat alerts), predictive supply forecasting, and a high-performance **AI Copilot** running in both textual and 3D visual graph modes.

---

## 🚀 Key Modules

1. **Executive Dashboard**: A premium, glassmorphic overview containing core KPIs (revenue, active tickets, KDS load, and safety compliance). Features an interactive, **3D Exploded Pizza visualizer** explaining live recipe ingredients and telemetry alerts.
2. **Command Center**: Real-time monitoring of all franchise outlets. Filter by region (Ahmedabad, Baroda, Surat, Gandhinagar, Rajkot), inspect live dining table occupancy, and access instant outlet manager contact details.
3. **Demand Forecasting**: Predictive machine learning model forecasting dough, cheese, and side ingredients for upcoming shifts, taking into account weekday factors, CNN weather indices, and promotional spikes.
4. **Logistics KDS & Transit**: Real-time Kitchen Display System displaying active order cards, live cooking states, and simulated MQTT telemetry for transit fleet trucks.
5. **CRM Ticket Hub**: High-speed portal for customer complaints, featuring automated sentiment scoring, priority labeling, and fast-toggle status updates.
6. **Food Safety Compliance**: Real-time regulatory audit checker displaying outlet health metrics, dynamic gas and moisture gauges, and automated inspection checklists.
7. **SKU Sales Dashboard**: Fine-grained distribution charts tracking unit volumes and growth trends of pizzas, sides, and beverages.
8. **AI Copilot (Dual-Mode)**: High-speed conversational LLM interface that runs in **Text Mode** (markdown explanations) and **Visual Mode** (futuristic 3D canvas graphs detailing financial and log analytics).

---

## 🛠️ Tech Stack

- **Frontend Core**: [React](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS with premium dark-glassmorphic variables, radial glow animations, perspective transforms, and responsive mobile-drawer behaviors.
- **Charts & Visuals**: [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **AI Integrations**: Llama-3 (Groq API Gateway) with custom context routing and RAG pipelines.
- **Deployment**: [Vercel](https://vercel.com/) SPA rewritten routing setup.

---

## 🏗️ System Architecture

FIP is built to process stream events, time-series telemetry, and external forecasts in real time. 

For a deep dive into the microservices layout, event bus pipelines, and AI orchestrators, check out the **[System Architecture Documentation](system_architecture.md)**.

### High-Level Flow Preview:
```
[Edge Outlets (POS, KDS, IoT, CNN)] ──> [Kong API Gateway] ──> [Apache Kafka Bus]
                                                                        │
[React Dashboard] <── [Groq LLM / Forecasting] <── [ClickHouse OLAP / Postgres]
```

---

## ⚙️ Local Setup and Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Clone the repository
```bash
git clone https://github.com/Sujaltalreja04/Martino_OS.git
cd Martino_OS
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
> ⚠️ **Important**: `.env` and `dist/` directories are ignored by git to protect API credentials and avoid push rejections.

### 4. Run the Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 🌐 Production Deployment

The project is pre-configured for seamless SPA deployment on Vercel using `vercel.json` at the root, which rewrites all incoming deep-links to `/index.html` (preventing 404 errors on browser refreshes):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

To deploy to Vercel:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` from the root directory.
3. Configure your `VITE_GEMINI_API_KEY` in Vercel's Environment Variables dashboard.
