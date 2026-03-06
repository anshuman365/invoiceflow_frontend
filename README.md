# InvoiceFlow Frontend

React + Vite frontend for InvoiceFlow — connects to Flask backend via Axios.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (Flask backend must be running on port 5000)
npm run dev
```

Open http://localhost:3000

## How it connects to Backend

Vite dev server proxies all `/api/*` requests to `http://localhost:5000`.
So frontend calls `/api/v1/auth/login` → Flask receives it on port 5000.

No CORS issues, no hardcoded URLs.

## Pages

| Route | Page |
|---|---|
| `/login` | Login |
| `/register` | Register |
| `/dashboard` | Dashboard with charts |
| `/invoices` | Invoice list |
| `/invoices/new` | Create invoice |
| `/invoices/:id` | Invoice detail + actions |
| `/invoices/:id/edit` | Edit invoice |
| `/clients` | Clients list |
| `/clients/:id` | Client detail |
| `/profile` | Profile & settings |

## Features

- JWT auth with auto refresh token
- Dashboard: revenue chart, stats, recent invoices
- Full invoice CRUD — create, edit, send, duplicate, cancel
- PDF download from backend
- Manual payment recording (bank, UPI, cash, cheque)
- Client portal link copy
- AI description enhancement (if OpenRouter key set)
- Client management with stats
- Profile & business settings

## Build for Production

```bash
npm run build
# Output in dist/ — serve with nginx or any static host
```
