# Pustakalaya Frontend

React + Vite frontend for the Pustakalaya Library Management System.

## Stack

- React 19, Vite 8, TypeScript
- Tailwind CSS v4, Shadcn-style UI components
- React Router 7, TanStack Query, Zustand
- React Hook Form + Zod, Axios, Socket.io client

## Quick start

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:3000** with API proxied to `http://localhost:5000`.

Ensure backend `CORS_ORIGIN` includes `http://localhost:3000`.

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API prefix (default `/api/v1`) |
| `VITE_SOCKET_URL` | Socket.io origin (empty = same as dev server) |
| `VITE_APP_NAME` | App title |

## Features

- Authentication (login, forgot password, JWT + httpOnly refresh cookie)
- Role-based dashboards (Super Admin, Counsellor, Branch Counsellor)
- Super Admin branch selector
- Student registration with seat map picker and file uploads
- Live seat grid visualization
- Plan management (Super Admin)
- Payments & renewals UI
- Reports dashboard
- Real-time notification bell (Socket.io)

## Project structure

```
src/
├── api/           # Axios client, endpoints, domain services
├── components/    # UI, layout, forms, seats, notifications
├── features/      # Feature-specific modules
├── hooks/         # Branch context, socket
├── lib/           # Utils, query client, constants
├── pages/         # Route pages
├── providers/     # React Query + Router
├── routes/        # Router config, protected routes
├── schemas/       # Zod validation schemas
├── stores/        # Zustand (auth, branch)
└── types/         # TypeScript types
```

## Production build

```bash
npm run build
npm run preview
```

Production URLs (also in `.env.production`):

| Service | URL |
|---------|-----|
| Frontend | https://pustakalaya-software-frontend.vercel.app/ |
| Backend API | https://pustakalaya-software-backend.onrender.com/api/v1 |

On Vercel, set the same `VITE_*` variables in **Project → Settings → Environment Variables**, then redeploy.

`vercel.json` rewrites unknown paths to `index.html` so client-side routes (e.g. `/students`) work on refresh. Without this, the host returns 404 for deep links.
