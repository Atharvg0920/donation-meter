# 🪔 Digital Donation Meter

Digital Donation Meter is a full-stack, real-time fundraising and digital signage platform designed for non-profits, community events, and temples to broadcast live fundraising progress on big screens while collecting contributions seamlessly via mobile QR codes. The platform bridges physical event spaces with mobile giving by instantly synchronizing donor contributions to a high-impact visual donation meter with celebration animations, dynamic progress tracking, and contributor recognition.

---

## 🚀 Live Demo

- **Frontend / Admin App:** `[Insert Live Demo URL - e.g., https://your-app.vercel.app]`
- **Live Display Screen:** `[Insert Display URL - e.g., https://your-app.vercel.app/display/:campaignId]`
- **Donation Page:** `[Insert Donation URL - e.g., https://your-app.vercel.app/donate/:campaignId]`
- **Backend API:** `[Insert Backend URL - e.g., https://your-api.onrender.com]`

---

## ✨ Features

- **Real-Time Big Screen Display**: Live-updating progress thermometer, recent contributor feed, celebration milestone animations, and target tracking.
- **Mobile-First Giving Flow**: QR-code-enabled donation flow with custom amounts, personalized donor messages, and instant receipt verification.
- **Real-Time Event Broadcasting**: Sub-second synchronization between donor phones and venue display screens powered by Server-Sent Events (SSE).
- **Comprehensive Admin Dashboard**:
  - Multi-campaign management (create, edit, delete, and view analytics)
  - Campaign metrics (total collected, active campaigns, contributor totals)
  - Printable/downloadable campaign QR codes
  - Full contribution audit history and demo contribution simulation tools
- **Pluggable Payment Engine**: Clean abstraction layer supporting instantaneous demo/mock payments for presentations, ready for production gateways (Razorpay, Stripe, UPI).

---

## 🛠️ Tech Stack

- **Client**: React 18, Vite, Tailwind CSS, React Router, Canvas Confetti, `qrcode.react`
- **Server**: Node.js, Express.js, Server-Sent Events (SSE)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Deployment**: Vercel (Frontend SPA) + Render / Railway (Backend API)

---

## 🏗️ Architecture

```
┌─────────────────────────┐          ┌───────────────────────────┐
│   Donor Mobile Phone    │          │     Big-Screen Display    │
│  (Scan QR & Contribute) │          │  (Real-Time Meter & Goal) │
└────────────┬────────────┘          └─────────────▲─────────────┘
             │ HTTP POST (Intent/Confirm)          │ SSE Stream
             ▼                                     │ (Instant Updates)
┌──────────────────────────────────────────────────┴─────────────┐
│                       Express Backend                          │
│  ┌───────────────────────┐         ┌─────────────────────────┐ │
│  │   Pluggable Payment   │         │       SSE Service       │ │
│  │  (Demo Provider / UPI)│         │     (Event Broadcaster) │ │
│  └───────────────────────┘         └─────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────┘
                             │ Mongoose ODM
                             ▼
                 ┌───────────────────────┐
                 │     MongoDB Atlas     │
                 │(Campaigns & Receipts) │
                 └───────────────────────┘
```

- **React + Vite + Tailwind Client**: Single Page Application (SPA) offering dedicated routes for donors (`/donate/:id`), public event screens (`/display/:id`), and organizers (`/admin`).
- **Express REST API**: Modular API with authentication middleware protecting sensitive management and mutation endpoints.
- **MongoDB Atlas**: Document store indexing campaigns and contribution records for low-latency queries and aggregates.
- **SSE Real-Time Synchronization**: Unidirectional event stream broadcasting verified transactions directly to connected displays without client polling.
- **Pluggable Payment Service**: Decoupled payment provider interface (currently driven by the built-in Demo Payment engine) allowing zero-codebase-refactor integration of production payment gateways.

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Clone the repository
```bash
git clone <repository-url>
cd donation-meter
```

### 2. Configure Environment Variables

**Server (`/server/.env`):**
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/donation-meter
PUBLIC_BASE_URL=http://localhost:5173
ADMIN_PASSWORD=admin123
PAYMENT_MODE=demo
CLIENT_ORIGIN=*
```

**Client (`/client/.env`):**
```bash
cp client/.env.example client/.env
```
For local development, `VITE_API_URL` can be left blank (Vite proxies `/api` to `localhost:5000`). For production, point it to your deployed API server URL.

### 3. Install Dependencies & Start Services

**Terminal 1 — Backend:**
```bash
cd server
npm install
npm run dev
```
Server starts on `http://localhost:5000`.

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```
Client starts on `http://localhost:5173`.

### 4. Testing Phone Scans on Local Network
1. Connect your phone and PC to the same Wi-Fi network.
2. Find your PC's local IP address (e.g., `192.168.1.5`).
3. Set `PUBLIC_BASE_URL=http://192.168.1.5:5173` in `server/.env` and restart the backend.
4. Scan the campaign QR code from your phone's camera.
