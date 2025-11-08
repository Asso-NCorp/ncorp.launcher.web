When connected to the svelte-llm MCP server, you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list_sections
Use this FIRST to discover all available documentation sections. Returns a structured list with titles and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get_documentation
Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list_sections tool, you MUST analyze the returned documentation sections and then use the get_documentation tool to fetch ALL documentation sections that are relevant for the users task.

## Copilot: Working Effectively in this Repo

This is a SvelteKit app (Node adapter) with Better Auth, Prisma (MySQL), and generated OpenAPI clients for a remote Server (C# ASP Net Web Api .NET 9) and a local Agent. Use the patterns below to stay consistent and productive.

### Architecture & Key Folders

- Runtime: SvelteKit + Vite, deployed via Node adapter (`build/index.js`, `build/handler.js`). A small HTTPS wrapper exists in `server.ts` (polka) for local TLS.
- Auth: Better Auth in `src/lib/auth/server.ts` and client in `src/lib/auth/client.ts`.
- DB: Prisma client in `src/server/db.ts` (reused via a global singleton; only use on server).
- APIs (generated):
    - Server API: `src/lib/api/server/**` (base: `PUBLIC_BACKEND_API_URL`)
    - Agent API: `src/lib/api/agent/**` (base: `PUBLIC_AGENT_URL`)
    - Shared models: `src/lib/shared-models/**`
- Utilities: `src/lib/utils.ts` (API helpers, array sync, game helpers), `src/lib/utils/*.ts`.
- Route groups: `src/routes/(guest)/**`, `src/routes/(authenticated)/**`, optional admin via `(admin)` in route id.
- Aliases: `$srv -> src/server`, `$src -> src`, `$lib -> src/lib` (see `svelte.config.js`).

### Dev, Build, Data Generation

- Dev server (HTTPS):
    ```cmd
    bun run dev
    ```
    Loads `.env.development` (copied to `.env`), uses Vite with TLS keys from `.cert/wildcard.n-lan.com.*` (see `vite.config.ts`).
- Build/Start:
    ```cmd
    bun run build
    bun run start
    ```
    Build outputs under `build/`. Start runs the Node adapter build.
- Prisma (DB):
    ```cmd
    bunx prisma migrate dev
    bunx prisma generate
    bun run db:full  && rem Better Auth migrate+generate
    ```
- OpenAPI (regenerate clients):
    ```cmd
    bun run genmodels
    bun run genserver
    bun run genagent
    bun run genall
    ```
    Do not hand-edit generated files under `src/lib/api/**` or `src/lib/shared-models/**`.

### Auth, Routing, and Locals

- Default: all routes are protected except when:
    - Route id contains `(guest)`; or pathname is one of `[PUBLIC_SIGNIN_PATH, "/signup"]`.
    - Path starts with `/api/auth` (Better Auth internals) or has no route id (assets).
      See `src/hooks.server.ts:isUnprotected`.
- Admin routes: if a route id contains `(admin)`, user must have role `admin` (see `hooks.server.ts`).
- On protected routes, `event.locals` provides `user`, `session`, and a JWT `token`. Use `locals.token` when calling the Server API.
- Outbound fetch: requests to `${PUBLIC_BACKEND_API_URL}/api` get `Authorization: Bearer <token>` automatically (`handleFetch`).

### Using APIs and DB (examples)

- Server API (server load):
    ```ts
    import { getServerApi } from "$src/lib/utils";
    export const load = async ({ locals }) => {
        const api = getServerApi(locals.token);
        const users = await api.getOnlineUsers();
        return { users };
    };
    ```
- Agent API (client or server):
    ```ts
    import { getLocalApi, getMachineApi } from "$src/lib/utils";
    const local = getLocalApi();
    const machine = getMachineApi();
    ```
- DB (server-only):
    ```ts
    import { db } from "$srv/db";
    const roles = await db.role.findMany();
    ```

### Data Caching Pattern

- Use lightweight, module-scoped caches with TTL, as in `src/routes/(authenticated)/+layout.server.ts`:
    - `GLOBAL_CACHE_TTL_MS` for global tables (events, roles, settings),
    - `GAMES_CACHE_TTL_MS` for available games, plus Prisma `groupBy` for installation counts.
      Reuse helpers like `extendGames` (`src/lib/utils/games.ts`).

### Env, TLS, and Service Worker

- Public env vars start with `PUBLIC_` (usable client+server). Private secrets come from `$env/static/private` (server only).
- Local TLS certs live under `.cert/`; Vite dev server and `server.ts` read them. Self-signed TLS is tolerated via `NODE_TLS_REJECT_UNAUTHORIZED='0'` in dev.
- Service worker registration is handled in `src/hooks.client.ts` (cleans old SW/caches in prod, then registers `/service-worker.js`). Do not register elsewhere.

### UI/Styling and Conventions

- Tailwind v4; use `cn()` from `src/lib/utils.ts` to merge classes.
- Prefer aliased imports (`$lib/...`, `$srv/...`) and colocate server utilities under `src/lib/server/**`.
- When adding protected pages, place them under `src/routes/(authenticated)/**`; for admin-only, include `(admin)` in the group name so `hooks.server.ts` enforces it.

### Gotchas

- Generated APIs depend on remote OpenAPI endpoints; builds may fail offline when regenerating—skip `gen*` unless needed.
- Only access Prisma (`db`) from server code (never the client). Respect alias `$srv`.
- If you need to call backend endpoints manually, prefer `getServerApi(locals.token)` over raw `fetch` to get auth and base URL correct.
