# HAPAMS — Hostel Academic Performance Analytics Management System

Full-stack project with **separated frontend and backend folders**.

## Project Structure

```
hapams/
├── backend/          ← Express.js REST API (Node 18+)
│   ├── src/
│   │   ├── server.js          ← Entry point  (port 5000)
│   │   ├── db.js              ← In-memory data store + helpers
│   │   ├── routes/index.js    ← All API routes
│   │   └── controllers/
│   │       ├── floors.js      ← Full CRUD for floors  ✅ BUG FIXED
│   │       ├── students.js    ← Full CRUD + bulk import
│   │       ├── rooms.js       ← Full CRUD for rooms
│   │       └── misc.js        ← Auth, users, reports, logs, settings, dashboard
│   └── package.json
│
└── frontend/         ← React 18 + Vite + Tailwind CSS  (port 5173)
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx             ← Login + sidebar + routing
    │   ├── api/client.js       ← All fetch() calls to the backend
    │   ├── components/ui.jsx   ← Shared UI primitives
    │   └── pages/
    │       ├── DashboardPage.jsx
    │       ├── StudentsPage.jsx
    │       ├── FloorsPage.jsx   ← Floor add/edit/delete – fully working
    │       ├── RoomsPage.jsx
    │       └── OtherPages.jsx   ← Reports, Users, Search, Activity, Settings, Result
    └── package.json
```

## 🐛 Bug that was fixed

**Problem:** In the original single-file version, `FloorsPage` used local React state
(`useState(MOCK_FLOORS)`) for the floors list.  When you submitted the "Add Floor" modal
the `handleSave` function did update state correctly, but the modal called `setModal(null)`
**before** the state setter had been applied because `nextFloorNum` was captured from a
stale closure.  Clicking "Add Floor" multiple times produced floors with duplicate names and
the list appeared frozen on first render.

**Fix:** Floors are now stored in the **backend** (single source of truth).  The frontend
calls `POST /api/floors`, receives the created floor object from the server, and appends it
to React state directly from the response.  Duplicate-name validation is done server-side
and returns a clear 409 error shown in the modal.

---

## Quick Start

### 1. Backend

```bash
cd hapams/backend
npm install
npm run dev
# API running at http://localhost:5000
```

### 2. Frontend

```bash
cd hapams/frontend
npm install
npm run dev
# App running at http://localhost:5173
```

### 3. Login

Open http://localhost:5173 — use any email/password, select a role.
- **Super Admin** — sees all pages including Floor Management
- **Warden** — limited to Dashboard, Result Analysis, Reports, Search

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST   | /api/auth/login      | Login (returns demo token) |
| GET    | /api/dashboard       | Dashboard statistics |
| GET    | /api/floors          | List all floors (with live student counts) |
| POST   | /api/floors          | **Add a new floor** |
| PUT    | /api/floors/:id      | Edit a floor |
| DELETE | /api/floors/:id      | Remove a floor |
| GET    | /api/students        | List students (filterable by dept/floor/status/q) |
| POST   | /api/students        | Add student |
| PUT    | /api/students/:regNo | Update student |
| DELETE | /api/students/:regNo | Delete student |
| DELETE | /api/students        | Clear all students |
| POST   | /api/students/bulk   | Bulk import from Excel rows |
| GET    | /api/rooms           | List rooms |
| POST   | /api/rooms           | Add room |
| PUT    | /api/rooms/:id       | Update room |
| DELETE | /api/rooms/:id       | Delete room |
| GET    | /api/users           | List users |
| POST   | /api/users           | Create user |
| DELETE | /api/users/:id       | Delete user |
| GET    | /api/reports         | List reports |
| POST   | /api/reports         | Generate report |
| DELETE | /api/reports/:id     | Delete report |
| GET    | /api/logs            | Activity log |
| GET    | /api/settings        | Get settings |
| PUT    | /api/settings        | Save settings |

---

## Production Notes

- Replace the in-memory `db.js` with a real database (PostgreSQL + Prisma recommended).
- Replace the demo JWT in `misc.js → login` with `jsonwebtoken` + proper password hashing.
- Add an auth middleware to protect all `/api` routes.
- Build the frontend with `npm run build` and serve the `dist/` folder from the Express app or a CDN.
