AGENT QUICK GUIDELINES

1. Install & Run: `pnpm install`; dev server `pnpm dev`; prod build `pnpm build`; preview `pnpm preview`.
2. Lint/Format: `pnpm lint` (writes fixes), `pnpm format`; full check/fix: `pnpm fix` or `pnpm check`; CI runs `biome ci ./src`.
3. Tests: No test framework or *.test.* files present; add Vitest if needed (suggest: script `"test": "vitest"`, single test `pnpm test path/to/file.test.ts`). Confirm with maintainer before introducing.
4. Imports: Use path alias `@/` (see `tsconfig{.app}.json`). Prefer absolute `@/lib/...` over deep relative. Biome auto-organizes imports.
5. Formatting: Managed by Biome (double quotes, organized imports, no unnecessary non-null rule disabled only: `noNonNullAssertion` off). Run format before commits.
6. Types/Strictness: TS strict mode ON; avoid `any`; leverage discriminated unions & explicit return types for exported funcs. Use `as const` for literal objects; prefer type imports (`import type {}`) for types.
7. Components: PascalCase for React components & files except route segments; hooks start with `use`; utility functions camelCase.
8. Error Handling: Centralized in `handleApiResponse` + custom `ApiError`; wrap fetch calls, rethrow preserving `ApiError`; never swallow—log (`console.error`) then throw meaningful message.
9. API Calls: Use `fetchWithAuth` + helpers; build URLs with `URL`/`URLSearchParams`; conditionally append fields; keep payload minimal (remove undefined keys).
10. State: Prefer React Query for async server state (`useQuery`, mutations) and Jotai for simple atoms; avoid redundant local state.
11. UI: Tailwind utility classes; compose with `cn()` from `utils`; badge/status helpers in `utils.tsx`—reuse instead of duplicating styling logic.
12. Date/Time: Use `date-fns`; all display formatting via helpers (e.g., `formatDateTime`, `formatDateRange`).
13. Accessibility: Use Radix UI primitives; ensure triggers have discernible text or `aria-label`.
14. Naming: Backend IDs often `publicId`; keep that exact name; booleans prefixed with `is/has/should`.
15. File Organization: Domain-focused folders (events, equipment, etc.); place shared cross-domain helpers in `src/lib` not components.
16. Adding Tests (future): Mirror file tree under `src`; colocate spec next to file (`file.test.ts`); keep pure logic extractable from components for testability.
17. Performance: Memoize expensive maps/filters; avoid unnecessary rerenders by lifting state & using stable callbacks.
18. Security: Sanitize/validate user inputs via schema (valibot) before API submission; never trust server error shapes—defensive parsing already implemented.
19. Git/CI: Ensure Biome passes locally before PR; do not commit generated `routeTree.gen.ts` if excluded.
20. Extending: When adding new API module, export typed functions following existing pattern: build payload, call `fetchWithAuth`, `handleApiResponse`, narrow return type.
