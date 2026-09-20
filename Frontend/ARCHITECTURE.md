# 📋 GMAO Interventions – Architecture Guide

## 🎯 Project Structure

```
src/
├── components/          # Shared UI components (charts, cards, modals)
├── features/           # Feature-specific pages
│   └── admin/pages/    # Dashboards (N1/N2/N3)
├── context/            # Global state (Auth, Notifications)
├── hooks/              # Custom hooks (dashboard badges, stats)
├── services/           # API client & calls
└── App.jsx             # Route definitions

```

## 🔑 Key Components

### 1. **Hooks** (`src/hooks/`)
- `useDashboardBadges()` – Priority/Status badges
- `useTicketStats()` – Chart data & KPIs

### 2. **API** (`src/services/api.js`)
- N1 endpoints: `/technicien/tickets?status=*`, `/technicien/interventions/start`
- N2 endpoints: `/technicien/tickets?status=ESCALATED_N2`
- N3 endpoints: `/technicien/tickets?status=ESCALATED_N3`

### 3. **Dashboards** (`src/features/admin/pages/`)
- **TechnicienN1Dashboard** – Simple interventions & escalation
- **TechnicienN2Dashboard** – On-site work + technical reports
- **TechnicienN3Dashboard** – Expert-level + equipment replacement

## 🔄 Workflow

```
Ticket Created → N1 (Remote) → N2 (On-Site) → N3 (Expert/Replacement) → Closed
```

Each level escalates with detailed reports saved in BDD.

## ✅ Code Standards

- Use **TailwindCSS** for styling (dark mode support)
- Use **Lucide icons** for UI
- Use **Framer Motion** for transitions
- Extract duplication → hooks
- All API calls go through `src/services/api.js`

## 📡 Integration Checklist

- [x] Auth & JWT middleware
- [x] Role-based routing (N1/N2/N3)
- [x] Notification system
- [x] Report generation
- [x] Dark mode toggle
- [ ] Email notifications (TODO)
- [ ] PDF export (TODO)
- [ ] Real-time socket updates (TODO)

## 🚀 Quick Start

```bash
npm install
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run lint         # Code quality check
```

## 🔐 Security Notes

- JWT token stored in localStorage
- 401 Unauthorized → auto redirect to login
- Token attached to all API requests via interceptor
- Roles enforced at route & component level

---

**Last Updated:** 2025-06-05 | **Status:** Production Ready ✅
