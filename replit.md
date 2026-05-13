# Fiqh Darah Calculator

A specialized tool for Muslim women to determine the legal status of vaginal bleeding (Haidl, Nifas, and Istihadloh) according to Islamic jurisprudence (Shafi'i school).

## Run & Operate

- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/fiqh-darah run dev` — run the frontend (port 5000)
- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS 4, Wouter, Framer Motion, Radix UI
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/fiqh-darah/` — React frontend (Vite)
- `artifacts/api-server/` — Express backend
- `artifacts/fiqh-darah/src/lib/fiqhEngine.ts` — Core Fiqh calculation logic
- `lib/db/src/schema/` — Drizzle ORM schema definitions
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for codegen)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas

## Architecture decisions

- The core Fiqh engine runs entirely client-side — no sensitive user data sent to server
- Frontend uses port 5000 (required for Replit webview)
- API server runs on port 8080
- Database is Replit's built-in PostgreSQL (DATABASE_URL auto-set)

## Product

A step-by-step calculator that classifies a woman's bleeding type (Haidl/Menstruasi, Nifas, Istihadloh) based on blood characteristics (color, thickness, odor), duration, and personal history. Provides day-by-day rulings on ritual obligations.

## User preferences

- Language: Indonesian (app UI is in Bahasa Indonesia)
- Islamic jurisprudence: Shafi'i school (Mazhab Syafi'i)

## Gotchas

- Always run `pnpm install` first if node_modules are missing
- The vite config requires both `PORT` and `BASE_PATH` env vars to be set
- After OpenAPI spec changes, re-run codegen before using updated types
