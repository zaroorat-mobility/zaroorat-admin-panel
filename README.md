# Zaroorat Mobility | Admin Panel

An enterprise-grade, highly scalable, React Admin Panel architecture designed for **Zaroorat Mobility**, a premier ride-hailing services platform.

## Tech Stack

The application is configured using a modern, robust, and performant frontend development suite:

- **Framework Core**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) (Strict type constraints)
- **Scaffolding/bundler**: [Vite](https://vite.dev) (Fast hot module reloading and build processing)
- **Routing**: [React Router v7](https://reactrouter.com) (Declarative route mappings, layout outlets, guards)
- **Client State**: [Zustand](https://github.com/pmndrs/zustand) (Atomic, lightweight, un-opinionated store managers)
- **Server State**: [TanStack React Query v5](https://tanstack.com/query) (Query caching, retry states, prefetching mutations)
- **HTTP Client**: [Axios](https://axios-http.com) (Configured interceptors, base settings, endpoints mapping)
- **Validation**: [Zod](https://zod.dev) (Runtime types checking, declarative validation schemas)
- **Forms**: [React Hook Form](https://react-hook-form.com) (Uncontrolled inputs performance, validation hooks)
- **Styling**: [TailwindCSS v3](https://tailwindcss.com) (Curated primary emerald theme, dark/light toggle)
- **Icons**: [Lucide React](https://lucide.dev) (Clean SVG-based iconography)

---

## Architectural Philosophy & Rules

The project structure enforces a clean, modular separation of concerns. Developers should adhere strictly to the following principles:

### 1. Structure Blueprint

```
src/
├── app/               # Application bootstrap (Router, Guards, Providers, Layouts, Configurations)
├── modules/           # Domain/Feature modules (Encapsulated scopes: Auth, Users, Drivers, Riders, etc.)
├── shared/            # Reusable components, hooks, schemas, types, constants, and styling utilities
├── infrastructure/    # Platform API wrappers, storage providers, analytics tracking, and RBAC mappings
├── store/             # Global client state handlers (Zustand)
├── assets/            # Static files, images, custom SVGs, and brand illustration vector maps
└── styles/            # CSS entry stylesheets and theme variables overrides
```

### 2. Data Lifecycle Workflow (Page → Hook → Service → API)

Under no circumstances should pages call API triggers or Axios instances directly. All network activity must follow the standard layered execution sequence:

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
- **Hook Layer**: Employs TanStack Query options (`useQuery` / `useMutation`). Connects server variables to React lifecycle variables.
- **Page Layer**: Accesses only the query result state. Displays tables, badges, indicators, and handles navigation.

### 3. State Boundaries

- **Server State** (Data fetched from backend APIs, e.g. drivers lists, audit history): Managed **strictly** by TanStack Query hooks.
- **Client State** (Visual layout preferences, sidebar visibility, theme selections, user tokens): Managed **strictly** by Zustand stores inside `/src/store`.

### 4. UI Boundaries

- All atomic visual components (`Button`, `Input`, `Select`, `Badge`, `Modal`, `Drawer`, `Alert`, `Tabs`, `Card`, `Table`) belong in `src/shared/components/ui/`.
- Pages should consume atomic and composite CRUD elements (`DataTable`, `ConfirmationModal`, `ViewDrawer`, `EmptyState`, `Pagination`) to maintain layout uniformity.

---

## Module Reference Registry

1. **`auth`**: Handles operator login sessions, credential validations, JWT tokens storage, and guest gate checks.
2. **`dashboard`**: Real-time stats widgets (Active drivers, ongoing trips, verification queues) and platform trend charts.
3. **`users`**: Manages backend operators, support agents, dispatchers, and system configurations.
4. **`riders`**: Customer profile index, platform ratings, trip booking histories, and emergency contacts.
5. **`drivers`**: Operator profiles, driver license codes, vehicle category mappings, and KYC verification indexes.
6. **`verification`**: Review checklists for pending driver applications, Aadhaar/PAN audits, and decisive logs approval/rejection.

---

## Development Guide

### Setup & Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev server**:
   ```bash
   npm run dev
   ```

3. **Verify compilation check**:
   ```bash
   npm run type-check
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```
