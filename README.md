# 🏆 GoldLoan Portal

A production-minded full-stack Gold Loan Intake Portal built with:

- **Backend**: Node.js · Express · TypeScript · Zod · Mongoose (MongoDB)
- **Frontend**: React · Vite · TypeScript · Tailwind CSS
- **AI Agent**: OpenAI tool-calling (all arithmetic via backend tools — no LLM math)
- **Tests**: Jest · ts-jest · Supertest · mongodb-memory-server

---

## 📦 Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | 6+ (local or Atlas) |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd gold-loan-portal
npm install          # installs server + client dependencies via workspaces
```

### 2. Environment Setup

```bash
# Windows
copy .env.example server\.env

# Mac / Linux
cp .env.example server/.env
```

Edit `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/goldloan
PORT=3000
OPENAI_API_KEY=sk-...          # Required only for AI chat feature
OPENAI_MODEL=gpt-4o-mini
```

### 3. Run Development Servers

```bash
# Start both server and client simultaneously
npm run dev
```

Or individually:
```bash
# Terminal 1 — Backend API (port 3000)
npm run dev --workspace=server

# Terminal 2 — Frontend (port 5173)
npm run dev --workspace=client
```

### 4. Run Tests

```bash
npm test
# Runs Jest (unit + API integration tests) against an in-memory MongoDB
# No real DB or network connection needed
```

### 5. Open in Browser

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Loan Application Portal |
| http://localhost:5173/admin | Admin Dashboard |
| http://localhost:3000/health | API Health Check |
| http://localhost:3000/api/v1/loan-schemes | Loan Schemes API |

---

## 📡 API Reference

### `GET /api/v1/loan-schemes`
Returns active loan schemes and current gold rate.

### `POST /api/v1/quotes`
Calculate loan eligibility (no DB write).
```json
{ "netWeightGrams": 20, "karat": 22, "schemeId": "emi" }
```

### `POST /api/v1/leads`
Submit a loan application.
```json
{
  "name": "Priya Sharma",
  "mobile": "9876543210",
  "grossWeightGrams": 22.5,
  "netWeightGrams": 20.0,
  "karat": 22,
  "schemeId": "emi"
}
```
Returns `409` with existing `applicationId` for duplicate mobiles within 7 days.
Returns `422` for validation failures with per-field error details.

### `GET /api/v1/leads`
List all leads (mobiles masked). Supports `?schemeId=`, `?status=`, `?page=`, `?limit=`.

### `POST /api/v1/agent/chat`
AI Loan Assistant endpoint (requires `OPENAI_API_KEY`).
```json
{ "messages": [{ "role": "user", "content": "What loan can I get for 20g of 22K gold?" }] }
```

---

## 🧮 Loan Calculation Logic

```
pureGoldGrams  = netWeightGrams × (karat ÷ 24)
goldValue      = pureGoldGrams × 7000   (24K rate = ₹7,000/g)
eligibleLoan   = floor(goldValue × min(plan.maxLtv, 0.75))
```

| Scheme | Rate | Max LTV | Repayment |
|--------|------|---------|-----------|
| Bullet Repayment | 12% p.a. | 70% | Lump-sum at maturity |
| Monthly EMI | 10.5% p.a. | 75% | 12 equal EMIs |

---

## 🧪 Test Coverage

```
server/src/__tests__/
├── quoteService.test.ts   — 6 math unit tests + masking + ID generation
└── api.test.ts            — API tests: 201, 409, 422, 404, scheme filters
```

Run with: `npm test` (uses in-memory MongoDB, no setup required)

---

## ✨ Features

- ✅ 3-step responsive loan application form
- ✅ Live quote with 300ms debounce
- ✅ Server-side quote recomputation on submit (tamper-proof)
- ✅ Duplicate mobile detection (7-day window → 409 Conflict)
- ✅ Mobile masking in all responses (`9876XXXX10`)
- ✅ Admin dashboard with filters, pagination & status badges
- ✅ AI Loan Assistant with tool-calling (no LLM arithmetic)
- ✅ All API keys secured server-side
- ✅ Mobile responsive at 375px

---

## 🔮 What I'd Do With More Time

1. **Live gold rate feed** — Replace the mocked ₹7,000/g with a real-time MCX/bullion API call, cached with Redis (TTL ~5 min) to avoid rate-limiting.

2. **Authentication & role-based access** — Add JWT auth for the admin panel; right now `/admin` is publicly accessible.

3. **Loan status webhook / SMS** — Fire an SMS (via Twilio/MSG91) on `status` change and add a `/api/v1/leads/:id/status` PATCH endpoint for the ops team.

4. **End-to-end tests** — Add Playwright tests covering the full 3-step form flow, 409 UX, and the AI chat widget.

5. **Document upload** — Allow borrowers to attach gold hallmark certificate photos; store in S3 with pre-signed URLs.

6. **Multi-branch support** — Add a `branchId` field and let the admin filter by branch; tie eligibility rules to branch-level LTV overrides.

7. **Rate-limiting & bot protection** — Add `express-rate-limit` on `POST /leads` and `POST /agent/chat` to prevent abuse.

8. **Observability** — Integrate OpenTelemetry tracing + structured logs (Pino) with a Grafana dashboard.

---

## 🔒 Security Notes

- **Never** expose `OPENAI_API_KEY` to the browser — all LLM calls go through the backend
- Mobile numbers stored plain in DB but always masked in API responses
- Input validation at both frontend (UX) and backend (Zod — authoritative source of truth)
- `.env` is gitignored; only `.env.example` is committed
