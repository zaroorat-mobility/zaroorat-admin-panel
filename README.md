# Zaroorat Mobility | Admin Panel

An enterprise-grade, highly scalable, React Admin Panel architecture designed for **Zaroorat Mobility**, a premier ride-hailing services platform.

---

## Tech Stack

The application is configured using a modern, robust, and performant frontend development suite:

- **Framework Core**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) (Strict type constraints)
- **Scaffolding/bundler**: [Vite 6](https://vite.dev) (Fast hot module reloading and build processing)
- **Routing**: [React Router v7](https://reactrouter.com) (Declarative route mappings, layout outlets, guards)
- **Client State**: [Zustand](https://github.com/pmndrs/zustand) (Atomic, lightweight, un-opinionated store managers)
- **Server State**: [TanStack React Query v5](https://tanstack.com/query) (Query caching, retry states, prefetching mutations)
- **HTTP Client**: [Axios](https://axios-http.com) (Configured interceptors, base settings, endpoints mapping)
- **Validation**: [Zod](https://zod.dev) (Runtime types checking, declarative validation schemas)
- **Forms**: [React Hook Form](https://react-hook-form.com) (Uncontrolled inputs performance, validation hooks)
- **Styling**: [TailwindCSS v3](https://tailwindcss.com) (Curated primary emerald theme, dark/light toggle)
- **Icons**: [Lucide React](https://lucide.dev) (Clean SVG-based iconography)

---

## Multi-Environment Architecture

The Admin Panel adheres to the unified 4-tier naming standard matching the backend and mobile apps:

| Tier | Admin Panel URL | Target Backend API URL | Environment File | Vite Build Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | `http://localhost:5173` | `http://localhost:3000/api/v1` | `.env.local` | `local` |
| **Dev** | `https://dev-admin.zaroorat.com` | `https://dev-api.zaroorat.com/api/v1` | `.env.dev` | `dev` |
| **Staging** | `https://staging-admin.zaroorat.com` | `https://staging-api.zaroorat.com/api/v1` | `.env.staging` | `staging` |
| **Production** | `https://admin.zaroorat.com` | `https://api.zaroorat.com/api/v1` | `.env.prod` | `prod` |

---

## Environment Files

Vite embeds variables starting with `VITE_` into client JavaScript bundles at compile time:

- **`.env.local`**: Workstation development (git-ignored, connects to local Fastify backend on port 3000).
- **`.env.dev`**: Droplet development deployment (git-ignored, connects to `dev-api.zaroorat.com`).
- **`.env.staging`**: QA staging deployment (git-ignored, connects to `staging-api.zaroorat.com`).
- **`.env.prod`**: Production release (git-ignored, connects to `api.zaroorat.com`).
- **`.env.example`**: Committed template.

---

## Architectural Philosophy & Rules

The project structure enforces a clean, modular separation of concerns:

### 1. Structure Blueprint

```
src/
├── app/               # Application bootstrap (Router, Guards, Providers, Layouts, Configurations)
├── modules/           # Domain/Feature modules (Auth, Users, Drivers, Riders, Pricing, etc.)
├── shared/            # Reusable components, hooks, schemas, types, constants, and styling utilities
├── infrastructure/    # Platform API wrappers, storage providers, analytics tracking, and RBAC mappings
├── store/             # Global client state handlers (Zustand)
├── assets/            # Static files, images, custom SVGs, and brand illustration vector maps
└── styles/            # CSS entry stylesheets and theme variables overrides
```

### 2. Data Lifecycle Workflow (Page → Hook → Service → API)

Under no circumstances should pages call API triggers or Axios instances directly:

```
[UI Screen / Page]
        │
        ▼ (triggers query/mutation)
   [Custom Hook]     <--- (TanStack React Query caches state & controls statuses)
        │
        ▼ (executes business formatting)
 [Domain Service]    <--- (Preprocesses parameters, handles mapping transforms)
        │
        ▼ (makes actual network call)
   [API Module]      <--- (Performs Axios request mapping to Endpoint routes)
```

- **API Layer**: Wraps Axios client instances. Contains raw requests mapping to `API_ENDPOINTS`.
- **Service Layer**: Implements core platform integrations. Formats API outputs into consumable objects.
- **Hook Layer**: Employs TanStack Query options (`useQuery` / `useMutation`). Connects server variables to React lifecycle.
- **Page Layer**: Accesses only the query result state. Displays tables, badges, indicators, and handles navigation.

### 3. State Boundaries

- **Server State** (Data fetched from backend APIs, e.g. drivers lists, audit history): Managed **strictly** by TanStack Query hooks.
- **Client State** (Visual layout preferences, sidebar visibility, theme selections, user tokens): Managed **strictly** by Zustand stores inside `/src/store`.

---

## Development Guide

### 1. Setup & Installation
```bash
npm install
```

### 2. Run Development Server Against Any Environment
```bash
# 1. Connect to Local Backend (http://localhost:3000/api/v1 via .env.local)
npm run local

# 2. Connect to Droplet Dev Backend (https://dev-api.zaroorat.com/api/v1 via .env.dev)
npm run dev

# 3. Connect to QA Staging Backend (https://staging-api.zaroorat.com/api/v1 via .env.staging)
npm run staging

# 4. Connect to Production Backend (https://api.zaroorat.com/api/v1 via .env.prod)
npm run prod
```

### 3. Verification & Quality Gates
```bash
# Strict TypeScript compilation check across all configs
npm run type-check

# Fast linter with oxlint
npm run lint
```

### 4. Production Builds
```bash
# Build for Droplet Dev (https://dev-admin.zaroorat.com)
npm run build:dev

# Build for QA Staging (https://staging-admin.zaroorat.com)
npm run build:staging

# Build for Production (https://admin.zaroorat.com)
npm run build:prod
```

---

## Production Droplet Deployment (Caddy)

Because the Admin Panel is built into static SPA assets (`dist/`), it is served directly by Caddy with auto-SSL:

```caddy
# Dev Admin Dashboard
dev-admin.zaroorat.com {
    root * /var/www/zaroorat-admin-dev/dist
    file_server
    try_files {path} /index.html
    encode zstd gzip
}

# Production Admin Dashboard
admin.zaroorat.com {
    root * /var/www/zaroorat-admin-prod/dist
    file_server
    try_files {path} /index.html
    encode zstd gzip
}
```

Deploying updates to the Droplet:
```bash
# On server or CI runner:
npm ci
npm run build:prod
sudo rsync -av --delete dist/ /var/www/zaroorat-admin-prod/dist/
sudo systemctl reload caddy
```
