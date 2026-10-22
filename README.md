# 🤖 AI SLA Assistant

An enterprise-grade operational ticket and SLA management platform powered by a **Spring Boot 3 REST API**, a **React Dashboard**, and a **Model Context Protocol (MCP)** LLM Agent loop with **RAG Policy Search** and an automated evaluation benchmarking harness, built with AI assistance.

---

## 🏗️ Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         React Dashboard (Frontend)                     │
│                • AuthContext (JWT) • ThemeContext (Dark Mode)          │
│                • Live Ticket Dashboard • Side-by-Side Chat Drawer      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ REST API                       │ HTTP POST /chat
                    ▼                                ▼
┌───────────────────────────────────────┐    ┌──────────────────────────┐
│        Spring Boot REST API           │    │      Agent Service       │
│              (backend/)               │    │         (agent/)         │
│  • Spring Security & JWT Auth         │    │  • Gemini ReAct Loop     │
│  • Ticket JPA Entity & Seeder         │    │  • Grounding Rules       │
│  • Dynamic SLA Engine & Indexing      │    │  • Write Confirmation    │
└───────────────────▲───────────────────┘    └────────────┬─────────────┘
                    │                                     │ MCP Protocol
                    │ Authenticated Axios                 │ (Stdio Transport)
                    └─────────────────────────────────────┴─────────────┐
                                                                        ▼
                                                             ┌────────────────────┐
                                                             │     MCP Server     │
                                                             │   (mcp-server/)    │
                                                             │ • list_tickets     │
                                                             │ • get_ticket       │
                                                             │ • get_at_risk      │
                                                             │ • update_status    │
                                                             └────────────────────┘
                                                                        │
                                                                        ▼
                                                             ┌────────────────────┐
                                                             │     Policy RAG     │
                                                             │  (docs/runbooks/)  │
                                                             │ • search_policy    │
                                                             └────────────────────┘
```

---

## ✨ Core Features

- **Spring Boot 3 Backend**: RESTful CRUD API, JPA repositories, PostgreSQL dynamic query indexing, and BCrypt encrypted JWT authentication.
- **SLA Calculation Engine**: Automated dynamic evaluation identifying tickets **at-risk** (< 4h threshold) or **breached**.
- **Model Context Protocol (MCP) Server**: Standalone TypeScript service decoupling AI tools from the core backend over Stdio transport.
- **Grounded ReAct Agent Loop**: Powered by Gemini (`gemini-3.6-flash`) with prompt grounding, structured logging, latency measurement, and write-action confirmation guardrails.
- **Policy RAG Search Engine**: In-memory vector/keyword chunk retrieval over markdown operational runbooks (`docs/runbooks/`).
- **Automated Evaluation Harness**: Benchmark script (`npm run eval`) running automated test cases and calculating model accuracy pass/fail rates.
- **React Dashboard UI**: Responsive Dark/Light mode UI with real-time status filtering and embedded VS Code-style side-by-side chat drawer.

---

## 🛠️ Project Structure

```text
ai-sla-assistant/
├── backend/          # Spring Boot 3 Java REST API
├── frontend/         # React SPA (Vite + Axios + CSS Variables)
├── mcp-server/       # TypeScript Model Context Protocol Server
├── agent/            # Node.js Agent Service (ReAct Loop, RAG, Eval Harness)
└── docs/             # Architectural decision ledger & operational runbooks
    ├── NOTES.md
    └── runbooks/
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java 17+** & **Maven**
- **Node.js v18+** & **npm**
- **PostgreSQL** running locally on port `5432` (database: `sla_db`)
- **Gemini API Key**

---

### 1. Backend Setup (Spring Boot)

Ensure local PostgreSQL is running with database `sla_db`, then run:

```bash
cd backend
./mvnw spring-boot:run
# Backend API listens on http://localhost:8080
```

---

### 2. MCP Server Setup

```bash
cd mcp-server
npm install
npm run build
# Built artifact generated at dist/index.js
```

---

### 3. Agent Service Setup

```bash
cd agent
npm install

# Create agent/.env file
echo "PORT=3001" > .env
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env
echo "MCP_SERVER_PATH=../mcp-server/dist/index.js" >> .env

npm run build
npm run dev
# Agent service listens on http://localhost:3001
```

---

### 4. Frontend Setup (React Dashboard)

```bash
cd frontend
npm install
npm run dev
# React app opens on http://localhost:5173
```

---

## 🧪 Running the Evaluation Harness

To run the automated benchmark evaluation suite against the Agent and Policy RAG pipeline:

```bash
cd agent
npm run eval
```

**Benchmark Output Example:**
```text
=== STARTING AGENT EVALUATION HARNESS ===

[TEST #1] Prompt: "What is the SLA resolution target for CRITICAL tickets?"
✅ PASSED

[TEST #2] Prompt: "Who should breached tickets be escalated to?"
✅ PASSED

[TEST #3] Prompt: "Show details for non-existent ticket #888888"
✅ PASSED

[TEST #4] Prompt: "What is the SLA resolution target for HIGH tickets?"
✅ PASSED

[TEST #5] Prompt: "Who is the contact for Security Incident Response?"
✅ PASSED

=== EVALUATION SUMMARY: 5/5 Passed (100%) ===
```

---

## 🔐 Default Credentials (Data Seeder)

- **Admin User**: `admin@company.com` / `admin123` (Full Read/Write/Admin Access)
- **Agent User**: `agent@company.com` / `agent123` (Read & Status Update Access)