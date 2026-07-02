# PR Creator

A one-page tool where the user types text, clicks a button, and a GitHub pull request is opened on `org-git-fked/git-fked-x2` with that text committed as a `.txt` file.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Frontend: `artifacts/pr-creator/` (react-vite, served at `/`), main page `src/pages/home.tsx`
- Backend PR route: `artifacts/api-server/src/routes/pullRequests.ts`
- API contract: `lib/api-spec/openapi.yaml` (source of truth; run codegen after changes)

## Architecture decisions

- GitHub access is via a GitHub App installation token (octokit `App`), not a PAT. Secrets: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID`.
- Target repo/base branch are hardcoded in `pullRequests.ts` (`org-git-fked/git-fked-x2`, `main`).
- The private key secret is normalized at runtime (single-line pasted PEMs with spaces or literal `\n` are re-wrapped into valid PEM).
- No database — the app is stateless.

## Product

- Enter text (and an optional PR title), click "Create Pull Request"
- Creates a timestamped branch + `.txt` file and opens a PR into `main`, then shows a link to the PR

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
