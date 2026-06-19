# Martinoz Franchise Intelligence Platform (FIP): Real-World System Architecture

This document maps out the production-grade, real-world system architecture for the Martinoz Pizza Franchise Intelligence Platform. It illustrates how edge IoT devices, transactional POS endpoints, external CNN weather feeds, predictive ML microservices, and LLM orchestration flow together to power the corporate control room.

---

## 1. System Design Infographic

![System Architecture Infographic](src/assets/system_architecture_diagram.png)

---

## 2. Functional Data Flow Diagram

```mermaid
flowchart TB
    %% Colors and Styles
    classDef edgeDevice fill:#1e293b,stroke:#00b4d8,stroke-width:2px,color:#f8f9fa;
    classDef ingestionLayer fill:#0f172a,stroke:#ff6b35,stroke-width:2px,color:#f8f9fa;
    classDef databaseLayer fill:#0f172a,stroke:#70e000,stroke-width:2px,color:#f8f9fa;
    classDef aiService fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#f8f9fa;
    classDef clientApp fill:#0c0a09,stroke:#e11d48,stroke-width:2px,color:#f8f9fa;

    subgraph "1. Edge & Outlet Data Sources"
        POS["Point-of-Sale (POS) System\n(Dine-in/Delivery/Pickup Transactions)"]:::edgeDevice
        IoT["IoT Telemetry Agents\n(Fridge/Oven Temp Sensors - MQTT)"]:::edgeDevice
        KDS["Kitchen Display Screens (KDS)\n(Live Cooking Queue State)"]:::edgeDevice
        TableSensors["Dine-in Table Trackers\n(Seat Occupancy/RFID Status)"]:::edgeDevice
    end

    subgraph "2. External Data & CNN Integration"
        CNNWeather["CNN Weather API\n(Real-Time Storm & Monsoon Alerts)"]:::edgeDevice
        HolidaysAPI["Google Calendar API\n(Regional/National Holidays Feed)"]:::edgeDevice
        NewsFeed["Local News RSS Feeds\n(Highway Blockages & Flood Updates)"]:::edgeDevice
    end

    subgraph "3. Ingestion & Event Streaming Layer"
        Kafka["Apache Kafka Event Bus\n(POS/KDS/IoT streams)"]:::ingestionLayer
        APIGateway["Kong API Gateway\n(OAuth2, Rate-limiting, Schema Validation)"]:::ingestionLayer
    end

    subgraph "4. Real-Time Data Storage & Warehousing"
        TimescaleDB["TimescaleDB\n(Time-Series IoT Telemetry Logs)"]:::databaseLayer
        PostgresSQL["PostgreSQL (OLTP)\n(Transactional Orders, CRM Tickets, Outlets)"]:::databaseLayer
        Redis["Redis Cache Cluster\n(Session states, active KDS tickets, locks)"]:::databaseLayer
        ClickHouse["ClickHouse (OLAP)\n(Historical BI Reports & Aggregations)"]:::databaseLayer
    end

    subgraph "5. AI Forecasting & LLM Orchestration"
        PredictiveEngine["FastAPI Demand Forecaster\n(Python Scikit-Learn/Prophet Model)"]:::aiService
        VectorDB["ChromaDB Vector Store\n(FAQ, SOPs, Recipe Manuals)"]:::aiService
        RAGOrchestrator["LlamaIndex / LangChain Router\n(RAG Context Construction)"]:::aiService
        GroqLLM["Groq Llama-3 API Gateway\n(High-Speed Inference Endpoint)"]:::aiService
    end

    subgraph "6. Client Presentation Layer"
        ReactApp["React / Vite App\n(Dark Glassmorphic UI, Chart.js Visuals)"]:::clientApp
    end

    %% Data Connections
    POS & KDS & TableSensors -->|"HTTPS/REST"| APIGateway
    IoT -->|"MQTT Protocol"| Kafka
    CNNWeather & HolidaysAPI & NewsFeed -->|"Cron Job Pull"| APIGateway
    
    APIGateway --> Kafka
    Kafka -->|"ETL pipeline"| TimescaleDB & PostgresSQL
    Kafka -->|"Write-through"| Redis
    
    TimescaleDB & PostgresSQL -->|"Batch Sync"| ClickHouse

    ReactApp -->|"Queries BI Data"| APIGateway
    APIGateway -->|"Fetch Context"| PostgresSQL
    
    %% AI Flow
    APIGateway -->|"Calculate Scenarios"| PredictiveEngine
    PredictiveEngine -->|"Reads Historical Aggregates"| ClickHouse

    %% Copilot LLM Flow
    ReactApp -->|"Chat prompt"| RAGOrchestrator
    RAGOrchestrator -->|"1. Query Live Metrics"| ClickHouse
    RAGOrchestrator -->|"2. Semantic Search SOPs"| VectorDB
    RAGOrchestrator -->|"3. Assemble System Prompt"| GroqLLM
    GroqLLM -->|"4. Return Markdown & Charts"| ReactApp

    class POS,IoT,KDS,TableSensors,CNNWeather,HolidaysAPI,NewsFeed edgeDevice;
    class Kafka,APIGateway ingestionLayer;
    class TimescaleDB,PostgresSQL,Redis,ClickHouse databaseLayer;
    class PredictiveEngine,VectorDB,RAGOrchestrator,GroqLLM aiService;
    class ReactApp clientApp;
```

---

## 3. Component Pipeline Details

### A. Edge & Data Integration (POS, IoT, CNN)
- **POS Transactions**: Captures every pizza sale, ticket pricing, and coupon codes. This feed updates corporate revenue statistics in real time.
- **IoT Telemetry**: Deployed directly inside cold-storage walk-in freezers (sending fridge temperatures) and baking conveyor ovens (sending cooking temperatures). Temperature flags (e.g. `fridge > 5°C` or `oven < 220°C`) trigger instant alerts in the control room.
- **CNN & External API Integration**: Ingests real-time monsoon storms, severe heatwaves, and public holidays. This feed is critical because:
  - Rainy forecasts close outdoor tables, trigger delivery transit delays, and shift consumer habits towards hot comfort foods.
  - Heatwaves reduce lunch hour dine-in counts by 15% and trigger compressor warnings on cold room IoT systems.

### B. Ingestion & Event Stream (Kafka / Gateway)
- **Apache Kafka**: Handles high-velocity telemetry logs from 40+ outlets simultaneously.
- **Kong API Gateway**: Secures client requests, performs token-based authentication, and maps frontend requests to target microservices.

### C. Data Storage (OLTP + OLAP)
- **PostgreSQL**: Manages active operational states, including complaints CRM tickets, outlet manager contacts, and active marketing promotions.
- **ClickHouse (OLAP)**: A column-oriented database optimized for fast business intelligence analytical queries (e.g., graphing sales trends across 1,000,000 historical transactions in milliseconds).

### D. AI Forecasting & Co-Pilot LLM
- **Predictive Engine (Python/FastAPI)**: Uses historical sales logs, current weekday factors, CNN weather forecasts, and promotional triggers to predict pizza dough portions, cheese, and sides requirements for the next shift.
- **LLM Co-Pilot Router**: 
  1. Accepts the user's natural language question (e.g. *"Show sales in Surat"*).
  2. Runs a semantic lookup on internal recipes or query structures.
  3. Pulls real-time statistics from ClickHouse.
  4. Bundles the SQL outcomes, prompt history, and operational rules into a structured context payload.
  5. Sends the payload to **Groq Llama-3** to output concise formatting and chart definitions (`[CMD: {...}]`) for the client.

### E. Frontend Presentation (Vite/React)
- **UI Framework**: React with Tailwind/CSS glassmorphic style templates.
- **Render Engine**: Renders dynamic interactive charts (Chart.js) and 3D card tilts (perspective transforms) to present business diagnostics.

---

## 4. Real-World Scenario Walkthrough

### Scenario: Severe Monsoon Storm hits Bopal Crossroad Outlet
1. **Monsoon Alert Ingestion**: The CNN weather system posts a high-wind rain warning.
2. **Logistics Rerouting**: Central supply monitors transit truck TRK-402 and adjusts dough/cheese schedules.
3. **Operations Adjustment**: Table occupancy models automatically flag table 10 (garden patio) as closed.
4. **LLM Explainer**: Copilot retrieves Bopal's telemetry metrics, lists the patio wind-closure, and recommends a localized promotional push.
