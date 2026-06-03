# Taskflow — Multi-Workspace Task Manager

**Assignment submission for Aspio.io Fullstack Engineer role**

## Start / End Time

- **Start:** June 2, 2026 — 3:00 PM EAT (East Africa Time, UTC+3)
- **End:** June 3, 2026 — [fill in your exact end time] EAT

---

## Live URL

[https://taskflow-theta-lyart.vercel.app](https://taskflow-theta-lyart.vercel.app)

---

## What Is Complete and Working

- **Auth** — Sign up, sign in, sign out via Supabase Auth (email + password). Email confirmation enabled.
- **Workspace dashboard** — Create workspaces, create projects, project cards with live task status counts as a color-coded bar.
- **Project view** — Full task list with status badges, assignee, due date color coding (red = overdue). Inline status cycling by clicking the badge.
- **Task detail panel** — All fields editable inline (title, description, status, assignee, due date). Save/discard affordance. Delete task.
- **RLS** — All 4 operations (SELECT, INSERT, UPDATE, DELETE) on all tables. Workspace isolation enforced. Tested against direct API calls.
- **Generated types** — `src/types/supabase.ts` generated via `supabase gen types typescript`. Zero `any` types.
- **SSR client pattern** — `createBrowserClient` / `createServerClient` from `@supabase/ssr`. No deprecated direct `createClient` in components.
- **Realtime** — Task changes broadcast via Supabase channels. Subscriptions cleaned up on unmount.
- **URL-synced filters** — Status + assignee filters via `nuqs`. Sharing the URL restores exact filter state.
- **Optimistic UI** — Task status updates applied immediately, rolled back with toast on API failure.
- **Loading / empty / error states** — Every data-fetching view has all three states with calls to action.
- **Edge Function** — `overdue-tasks`: accepts `project_id`, returns overdue tasks with assignee name. RLS enforced. Button in project view displays results.

---

## What Is Incomplete / Skipped

- **Mobile navigation** — Sidebar hidden on mobile. Content is accessible but navigation requires desktop width. Would add a Sheet drawer with more time.
- **Workspace member invite** — RLS fully supports multi-member workspaces; no invite UI was built.
- **Dark mode** — CSS variables defined, no toggle wired.

---

## Architectural Decisions

**Singleton browser client** — `@supabase/ssr` v0.10 creates a new instance per call. The singleton ensures the auth session is read once and shared, avoiding 403s from stale session reads on mutations.

**No `.select().single()` on mutations** — Supabase's new ES256 JWT causes PostgREST's `prefer: return=representation` to fail the SELECT RLS check on newly inserted rows (RETURNING runs before the workspace_members trigger completes). Using `prefer: return=minimal` avoids this.

**`nuqs` for URL state** — Handles Next.js `useSearchParams` Suspense boundary automatically. Manual `URLSearchParams` requires wrapping every consumer in `<Suspense>`.

**TanStack Query** — The `onMutate` / `onError` lifecycle makes optimistic UI + realtime compose cleanly. Cache invalidation on realtime events is one line.

**What I'd do with more time:** mobile drawer nav, workspace invite links, task drag-and-drop, project analytics, replace `<select>` with combobox components.

---

## How to Run Locally (5 commands)

```bash
git clone https://github.com/Andamlaka/taskflow.git
cd taskflow
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` with your Supabase project URL and anon key.

## Database Setup

1. Run `schema.sql` in the Supabase SQL Editor (creates tables, RLS, triggers, grants, realtime).
2. Sign up at least one user through the app.
3. Run `seed.sql` in the SQL Editor — auto-populates **2 workspaces, 4 projects, 15 tasks**
   (across all statuses and assignees, including overdue ones) for the signed-up user(s).

Seed is split from schema because Supabase seed rows must reference real `auth.users` IDs,
which only exist after signup. `seed.sql` resolves the user IDs automatically.

## Edge Function

The `overdue-tasks` function lives in `supabase/functions/overdue-tasks/`. Deploy with:

```bash
supabase functions deploy overdue-tasks --project-ref <your-project-ref>
```
