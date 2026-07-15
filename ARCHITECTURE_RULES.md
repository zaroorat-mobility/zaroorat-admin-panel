# Zaroorat Mobility | Architecture Rules

These rules represent the coding guidelines for developers working on the Zaroorat Mobility Admin Panel.

---

## 1. Feature-Based Architecture (FBA)

- Every domain logic should live inside a folder under `src/modules/<feature-name>/`.
- Feature modules should be completely self-contained. The folder must contain:
  - `pages/`: UI screens registered as route targets.
  - `components/`: Feature-specific visual components (never generic buttons/inputs).
  - `hooks/`: Domain React Query and state hooks.
  - `services/`: Logical processing wrappers (e.g. data mapper formatting).
  - `api/`: Raw Axios request executions.
  - `types/`: Domain-specific TypeScript declarations.
  - `schemas/`: Zod form schema rules.
  - `index.ts`: Barrel export exporting pages, public hooks, and types.
- If a component, hook, utility, or schema is reused across multiple modules, it must be promoted to the `src/shared/` directory.

---

## 2. strict Layer Separation (Page → Hook → Service → API)

- **Rule**: Page files must never import Axios or call endpoint paths directly.
- **Rule**: Hook files contain TanStack React Query wrappers. They handle loaders, caching, and mutation callback alerts.
- **Rule**: Service files format data, structure parameters, process mappers, and coordinate multiple API calls if needed.
- **Rule**: API files manage raw network queries. They import the configured `api` instance and make standard Axios calls using endpoints defined in `API_ENDPOINTS`.

---

## 3. Strict State Segregation

- **Server Cache (TanStack Query)**:
  - Cache all server resources (lists, details, statistics).
  - Do not copy server query data to Zustand stores or local state unless it is a draft being modified.
  - Use cache invalidation (`queryClient.invalidateQueries`) to refresh data after successful mutations.
- **Client State (Zustand)**:
  - Restrict Zustand usage to client-only UI configurations (e.g. navigation state, user profile auth credentials, dark mode variables, sidebar toggles).
  - Keeps stores lightweight and distinct inside `src/store/`.

---

## 4. Forms and Validation Constraints

- Always use **React Hook Form** for form data capture.
- Always use **Zod** to declare schemas for form validation and runtime API responses.
- Schema definitions must reside in the module's `schemas/` directory. Reusable, atomic validation regex rules (e.g., telephone verification, currency numbers, email templates) must be imported from `src/shared/schemas`.
- Form handlers must bind resolvers using `zodResolver(schema)`.

---

## 5. Strict TypeScript Compliance

- Keep `"strict": true` enabled in compiler options.
- Avoid using `any`. If a type is unknown, use `unknown`.
- Declare return values for all API calls and service operations.
- Ensure all custom component properties are defined inside interfaces.

---

## 6. Shared UI Component Constraints

- Standard atomic components (`Button`, `Input`, `Select`, `Badge`, `Modal`, `Drawer`, `Alert`, `Tabs`, `Card`, `Table`) must reside inside `src/shared/components/ui/`.
- Standard atomic UI components must be wrapper components around basic elements. They must use standard utility classes and support properties styling (e.g. supporting variants: outline, primary, secondary).
- Standard atomic components must support ref forwarding (`React.forwardRef`) where applicable to integrate with React Hook Form.

---

## 7. Reusable CRUD Pattern

- Dashboards, verification screens, and list files must utilize standard CRUD components:
  - `PageHeader`: Title layout with optional CTA actions and history back buttons.
  - `DataTable`: Generic grid mapping columns and cell rendering.
  - `FilterBar`: Wrapper for filters.
  - `SearchInput`: Standard debounced query field.
  - `StatusBadge`: Maps string status codes to styled visual tags.
  - `ConfirmationModal`: Modal for verification/action confirmation.
  - `ViewDrawer`: Sidebar sheet for entity detail views.
  - `EmptyState`: Empty indicator message placeholder.
  - `Pagination`: Paging index navigation.
