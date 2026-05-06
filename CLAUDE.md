# CLAUDE.md

This project builds GovConnect.ai web applications. Prefer pragmatic, reviewable changes and keep outputs concise.

## Platform Naming

GovConnect.ai, GovConnect, GCAI, and Semoss all refer to the same platform. Users may use any of these names — mirror their terminology in responses. Default to "GovConnect.ai" when no preference is shown.

## Key Files

- `semoss_config/environments.json` — named environments: endpoints, project IDs, app IDs (committed, no secrets)
- `semoss_config/credentials.env` — per-environment access/secret keys (gitignored, never commit)
- `.mcp.json` — MCP server connections for the active session (gitignored, inline Bearer tokens)
- `client/` — React app source (pnpm, Vite, TypeScript, Tailwind v4)
- `client/vite.config.ts` — must have `base: './'` and `outDir: '../../portals'`
- `portals/` — build output (gitignored), uploaded to GovConnect.ai
- `scripts/claude/semoss_asset_sync.py` — deploy script
- `docs/theme.md` — color palette reference

## Startup Checklist

When the user wants to build or deploy a GovConnect.ai app, run these steps before proceeding. If MCP connectivity isn't available, note it and continue — not every user has platform access.

1. **Credentials** — check `.mcp.json` for placeholder values. If found, ask the user for their GovConnect.ai access key and secret key, write them as `Authorization:Bearer <key>:<secret>`, then tell the user to restart Claude Code (MCP servers only load at startup).
2. **Project config** — read `semoss_config/environments.json`. If it has no envs configured, offer to set one up. Check that `semoss_config/credentials.env` exists — if not, ask the user for their keys and create it from `semoss_config/credentials.env.example`.
3. **MCP connectivity** — call `get_agent_platform_instructions` to verify the MCP servers are reachable. If it fails, credentials in `.mcp.json` are likely wrong. Don't block on this — continue if the user doesn't have access.
4. **Client dir** — if `node_modules/` is missing from `client/`, run `cd client && pnpm install`.

## GovConnect.ai Instance Config

Set `base_url` to your instance's hostname. For `api_module_url` and `web_module_url`, look at your instance URL — if it contains a path prefix before `/Monolith` or `/SemossWeb`, include it. Examples:

| Instance URL | `base_url` | `api_module_url` | `web_module_url` |
|---|---|---|---|
| `https://host.com/SemossWeb/...` | `https://host.com/` | `/Monolith` | `/SemossWeb` |
| `https://host.com/prod/SemossWeb/...` | `https://host.com/` | `/prod/Monolith` | `/prod/SemossWeb` |
| `https://host.com/demo/SemossWeb/...` | `https://host.com/` | `/demo/Monolith` | `/demo/SemossWeb` |

Update `semoss_config/environments.json` (for the relevant env entry) and `.mcp.json` (for the active MCP session) when configuring a new instance.

## Tech Stack (for scaffolding)

React 18, TypeScript strict, Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite`, not PostCSS), shadcn/ui (Base UI, `--base base`), TanStack Query v5, React Router v7, Vitest, Biome, pnpm 10.

**Never use npm or yarn — pnpm only.**

## Backend Options

The platform supports two backend approaches. Python (`py/mcp_driver.py`) is the default for most apps, but **Java reactors are fully supported** — use them when the user prefers Java, when performance matters, or when the logic fits better in a compiled reactor. Don't steer users away from Java.

- **Python** — logic in `py/mcp_driver.py`, called via `actions.runPy(...)` or exposed as MCP tools via `mcp/py_mcp.json`
- **Java** — extend `AbstractReactor`, called from the FE via `actions.run('ReactorName(param=["value"])')`

## GovConnect.ai Platform Concepts

### Pixel

GovConnect.ai's query language. Reactors are called as functions with array-wrapped params:
```
ReactorName(param1=["value1"], param2=[2]);
```
All parameters must be wrapped in `[]`.

### Reactor Naming

The `Reactor` suffix is stripped when calling via Pixel: `ItemsCRUDReactor` → `ItemsCRUD(...)`.

### Hash Routing

Always use `createHashRouter` — GovConnect.ai embeds apps in iframes that don't support browser history. Never use `createBrowserRouter`.

### Vite Config Requirements

```typescript
base: './',             // REQUIRED — relative paths for iframe embedding
outDir: '../../portals', // build output goes here (relative to src/ root)
```

### Runtime Config

`vite.config.ts` statically bakes three env vars into the JS bundle at build time via `define`:

| `.env.local` var | Source in `environments.json` | Notes |
|---|---|---|
| `APP` | `envs.<name>.app_id` | Required — empty string if unset breaks pixel calls |
| `MODULE` | `envs.<name>.api_module_url` | e.g. `/Monolith` or `/prod/Monolith` |
| `ENDPOINT` | `envs.<name>.base_url` | e.g. `https://your-instance.example.com/` |

Before any build, write `client/.env.local` with the target environment's values. `client/.env` has `ENDPOINT` and `MODULE` committed as defaults; `APP` is intentionally left commented out.

`client/public/config.json` (camelCase) is copied to `portals/` at build time and available at runtime for values that aren't baked in (e.g. `modelId`, `databaseId`). Keep it in sync with the target environment's `environments.json` entry before building.

### Database Schemas

Schemas from `get_schema()` are Base64-encoded — decode before use. Write decoded schema to `semoss_config/` for reference.

## Build & Deploy

There are two deployment methods:

| Method | What it does | When to use |
|---|---|---|
| **Deploy script** (`semoss_asset_sync.py`) | Directly uploads assets to a running instance | Dev, preprod, or any env you have direct credentials for |
| **ai-repo** (`ai-repo publish`) | Submits a zip into a review/approval pipeline | When going through a formal review process |

Both methods can target any environment — the distinction is governance, not environment.

### Before any build — sync `client/.env.local` and `client/public/config.json`

Write the target environment's values to `client/.env.local`:
```
APP=<envs.<name>.app_id>
ENDPOINT=<envs.<name>.base_url>
MODULE=<envs.<name>.api_module_url>
```

Also update `client/public/config.json` with the target env's `projectId`, `modelId`, `databaseId`, etc.

### Build
```bash
cd client && pnpm build
```

### Live deploy (sync script)

The `--env` flag tells the script which entry to read from `semoss_config/environments.json` and `semoss_config/credentials.env`.

```bash
cd client && pnpm build && cd ..
python scripts/claude/semoss_asset_sync.py --env <name> delete portals/assets --yes
python scripts/claude/semoss_asset_sync.py --env <name> bulk-upload portals
```

**First deploy only:** skip the `delete` step — the remote path doesn't exist yet:
```bash
python scripts/claude/semoss_asset_sync.py --env <name> bulk-upload portals
```

**Self-signed SSL certificates (preprod):**
```bash
python scripts/claude/semoss_asset_sync.py --env <name> --no-verify-ssl bulk-upload portals
```

### Submit for review (ai-repo)

`ai-repo` submits a zip into an approval pipeline — it does **not** publish the app to users. After approval, an admin deploys server-side via `RepositoryDeployApp`, which auto-creates the SEMOSS project on the target instance.

**Important: the ai-repo `app_id` IS the SEMOSS `project_id` at deploy time.** When building for ai-repo submission, `APP` in `client/.env.local` and `projectId` in `client/public/config.json` must be set to the `app_id` for the target environment — not a separately-created project ID. The deploy reactor synthesizes the `.smss` with `PROJECT={app_id}`, so any embedded refs need to match.

```bash
# First time: register the app on the target environment
ai-repo login --base-url <base_url>/Monolith --access-key <key> --secret-key <key>
ai-repo create-app --name "<name>" --business-unit "<team>" --description "<desc>"
# Save the returned app_id to environments.json under envs.<name>.app_id

# Build targeting the submission environment, then submit
cd client && pnpm build && cd ..
zip -r portals.zip portals/
ai-repo publish portals.zip --app <app_id> --notes "<notes>"
rm portals.zip

# Check status
ai-repo status --app <app_id>
```

**`ai-repo` not found?** It lives in pnpm's bin directory. Prefix the failing command with `PATH="$HOME/Library/pnpm:$PATH"` to fix it.

After all reviews pass (Initial → Security → Final, all approved), an admin runs the deploy reactor directly via Pixel:
```
RepositoryDeployApp(appId="<app_id>", versionId="<version_id>")
```
On first deploy, SEMOSS auto-registers the project under `app_id` and grants OWNER access to the deployer + READ_ONLY access to the version's submitter.

`ai-repo` is usually already logged in. Only run `ai-repo login` if you get an auth error. Credentials come from `semoss_config/credentials.env`.

**Self-signed SSL certificates (preprod):** Prefix `ai-repo` commands with `NODE_TLS_REJECT_UNAUTHORIZED=0`:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 ai-repo create-app --name "..." --business-unit "..." --description "..."
NODE_TLS_REJECT_UNAUTHORIZED=0 ai-repo publish portals.zip --app <app_id> --notes "..."
```

## Multi-Environment Workflow

The agent handles all environment switching. Users just name the target.

### "Deploy the app to `<env>`"
1. Read `semoss_config/environments.json` → `envs.<env>`: `base_url`, `api_module_url`, `project_id`
2. Write `client/.env.local`: `APP=<project_id>`, `ENDPOINT=<base_url>`, `MODULE=<api_module_url>`
3. Update `client/public/config.json` with the env's values (`projectId`, `modelId`, etc.)
4. `cd client && pnpm build && cd ..`
5. `python scripts/claude/semoss_asset_sync.py --env <env> delete portals/assets --yes`
6. `python scripts/claude/semoss_asset_sync.py --env <env> bulk-upload portals`

### "Submit for review on `<env>`"
1. Read `semoss_config/environments.json` → `envs.<env>`: `base_url`, `api_module_url`, `app_id`
2. Read `semoss_config/credentials.env` → `<ENV>_ACCESS_KEY`, `<ENV>_SECRET_KEY`
3. Write `client/.env.local`: `APP=<app_id>`, `ENDPOINT=<base_url>`, `MODULE=<api_module_url>`
4. Update `client/public/config.json` with `projectId=<app_id>` and the env's other values
5. `cd client && pnpm build && cd ..`
6. `ai-repo login --base-url <base_url>/Monolith --access-key <key> --secret-key <key>`
7. `zip -r portals.zip portals/ && ai-repo publish portals.zip --app <app_id> --notes "<notes>" && rm portals.zip`

## semoss_config/environments.json Shape

```json
{
  "model_id": "",
  "database_id": "",
  "envs": {
    "dev": {
      "label": "Development",
      "base_url": "https://your-instance.example.com/",
      "api_module_url": "/Monolith",
      "web_module_url": "/SemossWeb",
      "project_id": "",
      "app_id": ""
    }
  }
}
```

`project_id` — used by the deploy script for direct asset uploads. Set when creating a project via MCP.
`app_id` — used by `ai-repo` for the review pipeline. Set after running `ai-repo create-app`. On the same endpoint, `app_id` and `project_id` are different IDs that may or may not refer to the same logical app.

Add more envs by adding entries under `envs` — name them anything (`dev`, `preprod`, `prod`, `workshop`, etc.).

## semoss_config/credentials.env Shape

```
# Prefix matches the env name in environments.json, uppercased.
DEV_ACCESS_KEY=
DEV_SECRET_KEY=

PROD_ACCESS_KEY=
PROD_SECRET_KEY=
```

Copy from `semoss_config/credentials.env.example`. Gitignored — never commit.

## MCP Servers

| Server | Purpose |
|--------|---------|
| `Semoss_Platform_Instructions` | Platform docs and guidance |
| `Semoss_project_manager` | Create projects, upload files, publish |
| `Semoss_database_helper` | Create/query databases, get schema |

### MCP Quirks

- **`create_project` always reports an error string** — even on success, the tool returns `"Could not determine project_id"`. The real project data (including `project_id`) is embedded in that message; parse it rather than treating it as a failure.
- **Project names must be unique** — `create_project` returns a hard error if the name already exists on the platform. Pick a unique name or check first.
- **Update `environments.json` before running the sync script** — `semoss_asset_sync.py` reads `project_id` from the target env's entry. When creating a new project, save the new `project_id` into `environments.json` before running the deploy, or files will go to the wrong project.

## URL Patterns

| Purpose | Pattern |
|---------|---------|
| App view | `<base_url><web_module_url>/packages/client/dist/#/app/<project_id>/view` |
| Database | `<base_url><web_module_url>/packages/client/dist/#/engine/database/<database_id>` |

## Tagging

After publishing, tag via MCP: `attach_tag(project_id, tag)`. Common tags: `approval-pending`, `approved`, `draft`, `deprecated`. Confirm with the user before applying.
