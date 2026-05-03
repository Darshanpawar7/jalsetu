<div align="center">
  <h1>🌊 JalSetu</h1>
  <p><strong>Smart Water Management Platform for Solapur</strong></p>
  <p>
    IoT Sensor Telemetry • Citizen Complaints • Automated Ticketing • Equity Tracking
  </p>
</div>

---

JalSetu is a comprehensive, real-time water management platform designed to monitor water distribution, handle citizen complaints, and ensure equitable water supply across wards. 

It seamlessly bridges the gap between on-ground IoT sensors, citizen reporting, and municipal operators by unifying data into a single, intelligent dashboard.

### 🎥 Demo Video
[![JalSetu Demo](https://img.shields.io/badge/YouTube-Watch_Video-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/6h177XYwRX8?si=LWzIVPNuzODiMuiL)

---

## ✨ Key Features

- **📡 Real-Time IoT Telemetry**: MQTT-driven simulator for continuous sensor and complaint streams.
- **🗺️ Live Operator Dashboard**: Interactive water network map with sensor and complaint markers using MapLibre.
- **📱 Citizen Complaint Portal**: Geo-enabled complaint reporting form with optional photo support.
- **🎟️ Automated Ticketing**: Intelligent ticket creation with priority and SLA context.
- **⚖️ Ward Equity Monitoring**: Analytics for service fairness and pressure distribution.
- **⚡ Live Event System**: WebSocket connectivity for real-time alerts, sensor anomalies, and dashboard updates.
- **🎭 Hackathon Demo Controller**: Full end-to-end storytelling flow from complaint to resolution.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| **Frontend** | React, React Router, Axios, Recharts, MapLibre, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO, MQTT |
| **Database** | PostgreSQL, PostGIS |
| **Simulation** | Node.js, MQTT, Axios |

---

## 🏗️ Architecture & Data Flow

```mermaid
graph TD;
    A[Citizen / Simulator] -->|Submits Complaint| B(Backend API);
    S[IoT Sensors / Simulator] -->|MQTT| C(MQTT Broker);
    C -->|Sensor Data| B;
    B -->|Reads/Writes| D[(PostgreSQL + PostGIS)];
    B -->|Calculates Equity & Priority| B;
    B -->|Socket.IO| E[React Dashboard];
    E -->|Visualizes Data| Operator[Municipal Operator];
```

---

## 📂 Repository Structure

```text
jalsetu/
├── backend/               # Node.js Express API & MQTT Client
│   ├── controllers/
│   ├── database/          # schema.sql (PostgreSQL + PostGIS)
│   ├── routes/
│   └── services/
├── frontend/              # React Operator Dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
└── simulator/             # IoT Sensor & Complaint Event Generator
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or newer) & **npm**
- **PostgreSQL** (v12 or newer) with **PostGIS** extension enabled
- **MQTT Broker** (e.g., Eclipse Mosquitto)

### 1. Database Setup
1. Create a PostgreSQL database named `jalsetu`.
2. Enable the PostGIS extension in your database:
   ```sql
   CREATE EXTENSION postgis;
   ```
3. Execute the schema script:
   ```bash
   psql -d jalsetu -f backend/database/schema.sql
   ```

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgres://user:password@localhost:5432/jalsetu
PORT=5000
MQTT_BROKER=mqtt://localhost:1883
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

*(Optional)* Frontend `.env` in `frontend/`:
```env
REACT_APP_API=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
```

*(Optional)* Simulator `.env` in `simulator/`:
```env
MQTT_BROKER=mqtt://localhost:1883
```

### 3. Running the Services
You need to start all three services in separate terminal instances.

**Backend Server**
```bash
cd backend
npm install
npm start
```
*API running at `http://localhost:5000/api`*

**Frontend Dashboard**
```bash
cd frontend
npm install
npm start
```
*React app running at `http://localhost:3000`*

**IoT Simulator**
```bash
cd simulator
npm install
npm start
```

---

## 🔌 API & Real-time Events

### REST API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check |
| `GET/POST` | `/api/complaints` | Fetch or submit citizen complaints |
| `GET` | `/api/tickets` | Retrieve active work tickets |
| `GET` | `/api/sensors` | Fetch current sensor statuses |
| `GET` | `/api/analytics/equity`| Get ward equity metrics |
| `POST` | `/api/demo/start` | Trigger the hackathon demo sequence |

### WebSocket Events
The dashboard listens for real-time updates via Socket.IO:
- **Alerts**: `alert`, `critical_alert`, `sensor_anomaly`
- **Data Updates**: `sensor_data`, `new_complaint`
- **Ticketing**: `ticket_created`, `ticket_updated`
- **Demo Flow**: `demo_event`, `demo_started`, `demo_step_result`, `demo_completed`

---

## 🎬 Demo Workflow

The built-in demo mode is tailored for presentations and hackathons, illustrating a complete automated workflow:

1. **Intake**: Citizen complaint is submitted via the simulator.
2. **Ticketing**: Automatic creation and prioritization of the work ticket.
3. **Correlation**: System correlates complaint with nearby IoT sensor data.
4. **Assignment**: Junior Engineer (JE) is assigned.
5. **Action**: Field repair initiated.
6. **Verification**: AI photo verification of the resolved issue (mocked).
7. **Resolution**: Ticket closed and equity scores updated dynamically.

---

## 📝 Notes
- The WhatsApp/Twilio integration is currently mocked for demo purposes.
- Geographic functionalities (wards, sensors, leak events) rely heavily on **PostGIS**.
- MQTT is the live transport used by the simulator and backend services.
- No license file is currently included in the repository.
