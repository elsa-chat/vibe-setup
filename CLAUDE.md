# CLAUDE.md

This project builds GovConnect.ai web applications. Prefer pragmatic, reviewable changes and keep outputs concise.

## Platform Naming

GovConnect.ai, GovConnect, GCAI, and Semoss all refer to the same platform. Users may use any of these names — mirror their terminology in responses. Default to "GovConnect.ai" when no preference is shown.

## Key Files

- `semoss_config/environments.json` — named environments: endpoints and app IDs (gitignored, copy from `environments.json.example`)
- `semoss_config/credentials.env` — per-environment access/secret keys (gitignored, copy from `credentials.env.example`)
- `.mcp.json` — MCP server connections with inline Bearer tokens (gitignored, copy from `.mcp.json.example`)
- `client/` — React app source (pnpm, Vite, TypeScript, Tailwind v4)
- `client/vite.config.ts` — must have `base: './'` and `outDir: '../../portals'`
- `portals/` — build output (gitignored), uploaded to GovConnect.ai
- `scripts/claude/semoss_asset_sync.py` — deploy script
- `docs/theme.md` — color palette reference

## Startup Checklist

When the user wants to build or deploy a GovConnect.ai app, run these steps before proceeding. Getting platform instructions via MCP should happen before any app work — they provide up-to-date guidance that affects how you build. Always attempt this before starting.

1. **Credentials** — if `.mcp.json` doesn't exist, copy it from `.mcp.json.example`. Then check for placeholder values. If found, ask the user for their GovConnect.ai access key and secret key, write them as `Authorization:Bearer <key>:<secret>`, then tell the user to restart Claude Code and **stop here** — MCP servers only load at startup, so nothing that requires platform access will work until they restart and you confirm connectivity in step 3.
2. **Project config** — if `semoss_config/environments.json` doesn't exist, copy it from `semoss_config/environments.json.example` and ask the user to fill in their environment details. Check that `semoss_config/credentials.env` exists — if not, ask the user for their keys and create it from `semoss_config/credentials.env.example`.
3. **MCP connectivity** — call `get_agent_platform_instructions` to verify the MCP servers are reachable. If it fails, ask the user whether they have platform access before continuing — the instructions it returns should inform your work. Only proceed without it if the user confirms they don't have access.
4. **Client dir** — if `node_modules/` is missing from `client/`, run `cd client && pnpm install`.

**Do not create databases, projects, or other platform resources unless the user explicitly asks.** The typical workflow is: build the app locally, then submit via `ai-repo`. Resource creation is a deliberate step, not a default.

## GovConnect.ai Instance Config

Set `base_url` to your instance's hostname. For `api_module_url` and `web_module_url`, look at your instance URL — if it contains a path prefix before `/Monolith` or `/SemossWeb`, include it. Examples:

| Instance URL | `base_url` | `api_module_url` | `web_module_url` |
|---|---|---|---|
| `https://host.com/SemossWeb/...` | `https://host.com/` | `/Monolith` | `/SemossWeb` |
| `https://host.com/prod/SemossWeb/...` | `https://host.com/` | `/prod/Monolith` | `/prod/SemossWeb` |
| `https://host.com/demo/SemossWeb/...` | `https://host.com/` | `/demo/Monolith` | `/demo/SemossWeb` |

Update `semoss_config/environments.json` and `.mcp.json` when configuring a new instance.

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

Before any build, write `client/.env.local` with the target environment's values. `client/.env` is committed as a placeholder with dummy defaults — never edit it. `client/.env.local` overrides it and is gitignored; the agent writes it before every build.

### Database Schemas

Schemas from `get_schema()` are Base64-encoded — decode before use. Write decoded schema to `semoss_config/` for reference.

## Build & Deploy

There are two deployment methods:

| Method | What it does | When to use |
|---|---|---|
| **Deploy script** (`semoss_asset_sync.py`) | Directly uploads assets to a running instance | Dev, preprod, or any env you have direct credentials for |
| **ai-repo** (`ai-repo publish`) | Submits a zip into a review/approval pipeline | When going through a formal review process |

Both methods can target any environment — the distinction is governance, not environment.

### Before any build — write `client/.env.local`

Write the target environment's values to `client/.env.local`:
```
APP=<envs.<name>.app_id>
ENDPOINT=<envs.<name>.base_url>
MODULE=<envs.<name>.api_module_url>
```

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

**Important:** `APP` in `client/.env.local` must be set to the `app_id` for the target environment before building. The deploy reactor synthesizes the `.smss` with `PROJECT={app_id}`, so any embedded refs need to match.

```bash
# First time: register the app on the target environment
ai-repo login --base-url <base_url>/Monolith --access-key <key> --secret-key <key>
ai-repo create-app --name "<name>" --business-unit "<team>" --description "<desc>"
# Save the returned app_id to environments.json under envs.<name>.app_id

# Build targeting the submission environment, then submit
cd client && pnpm build && cd ..
ai-repo publish --app <app_id> --notes "<notes>"

# Check status
ai-repo status --app <app_id>
```

`publish` runs from the project root and handles zipping automatically. It includes `client`, `java`, `portals`, `py`, and `mcp` by default. Use `--include <dirs>` for extra paths or `--dry-run` to preview contents without uploading.

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
NODE_TLS_REJECT_UNAUTHORIZED=0 ai-repo publish --app <app_id> --notes "..."
```

## Multi-Environment Workflow

The agent handles all environment switching. Users just name the target.

### "Deploy the app to `<env>`"
1. Read `semoss_config/environments.json` → `envs.<env>`: `base_url`, `api_module_url`, `app_id`
2. Write `client/.env.local`: `APP=<app_id>`, `ENDPOINT=<base_url>`, `MODULE=<api_module_url>`
3. `cd client && pnpm build && cd ..`
4. `python scripts/claude/semoss_asset_sync.py --env <env> delete portals/assets --yes`
5. `python scripts/claude/semoss_asset_sync.py --env <env> bulk-upload portals`

### "Submit for review on `<env>`"
1. Read `semoss_config/environments.json` → `envs.<env>`: `base_url`, `api_module_url`, `app_id`
2. Read `semoss_config/credentials.env` → `<ENV>_ACCESS_KEY`, `<ENV>_SECRET_KEY`
3. Write `client/.env.local`: `APP=<app_id>`, `ENDPOINT=<base_url>`, `MODULE=<api_module_url>`
4. `cd client && pnpm build && cd ..`
5. `ai-repo login --base-url <base_url>/Monolith --access-key <key> --secret-key <key>`
6. `ai-repo publish --app <app_id> --notes "<notes>"`

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
      "app_id": ""
    }
  }
}
```

`app_id` — the identifier for the app/project on this environment. Set after running `ai-repo create-app`. Different environments will have different `app_id` values for the same logical app.

**Note:** "app" and "project" are synonyms on the GovConnect.ai platform. The CLI, backend, and deploy script use both terms interchangeably — they refer to the same thing. `app_id` is the canonical field name here.

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

- **`create_project` always reports an error string** — even on success, the tool returns `"Could not determine project_id"`. The real project data (including the app/project ID) is embedded in that message; parse it rather than treating it as a failure.
- **Project names must be unique** — `create_project` returns a hard error if the name already exists on the platform. Pick a unique name or check first.
- **Update `environments.json` before running the sync script** — `semoss_asset_sync.py` reads `app_id` from the target env's entry. When creating a new project, save the new `app_id` into `environments.json` before running the deploy, or files will go to the wrong project.

## URL Patterns

| Purpose | Pattern |
|---------|---------|
| App view | `<base_url><web_module_url>/packages/client/dist/#/app/<app_id>/view` |
| Database | `<base_url><web_module_url>/packages/client/dist/#/engine/database/<database_id>` |

## Tagging

After publishing, tag via MCP: `attach_tag(app_id, tag)`. Common tags: `approval-pending`, `approved`, `draft`, `deprecated`. Confirm with the user before applying.
