# CLAUDE.md

This project builds GovConnect.ai web applications. Prefer pragmatic, reviewable changes and keep outputs concise.

## Platform Naming

GovConnect.ai, GovConnect, GCAI, and Semoss all refer to the same platform. Users may use any of these names — mirror their terminology in responses. Default to "GovConnect.ai" when no preference is shown.

## Key Files

- `semoss_config/config.json` — GovConnect.ai project metadata (`project_id`, `app_id`, `base_url`, etc.)
- `.mcp.json` — MCP credentials (gitignored, inline Bearer tokens)
- `client/` — React app source (pnpm, Vite, TypeScript, Tailwind v4)
- `client/vite.config.ts` — must have `base: './'` and `outDir: '../portals'`
- `portals/` — build output (gitignored), uploaded to GovConnect.ai
- `scripts/claude/semoss_asset_sync.py` — deploy script
- `docs/theme.md` — color palette reference

## Startup Checklist

1. **Credentials** — check `.mcp.json` for placeholder values. If found, ask the user for their GovConnect.ai access key and secret key, write them as `Authorization:Bearer <key>:<secret>`, then tell the user to restart Claude Code (MCP servers only load at startup).
2. **Project config** — read `semoss_config/config.json`. If `project_id` is empty, offer to create a new project via MCP.
3. **MCP connectivity** — try a GovConnect.ai MCP tool. If it fails, credentials are likely wrong.
4. **Client dir** — if `client/` doesn't exist, offer to scaffold. If it exists but `node_modules/` is missing, run `cd client && pnpm install`.

## GovConnect.ai Instance Config

Set `base_url` to your instance's hostname. For `api_module_url` and `web_module_url`, look at your instance URL — if it contains a path prefix before `/Monolith` or `/SemossWeb`, include it. Examples:

| Instance URL | `base_url` | `api_module_url` | `web_module_url` |
|---|---|---|---|
| `https://host.com/SemossWeb/...` | `https://host.com/` | `/Monolith` | `/SemossWeb` |
| `https://host.com/prod/SemossWeb/...` | `https://host.com/` | `/prod/Monolith` | `/prod/SemossWeb` |
| `https://host.com/demo/SemossWeb/...` | `https://host.com/` | `/demo/Monolith` | `/demo/SemossWeb` |

Update both `semoss_config/config.json` and `.mcp.json` when setting these.

## Tech Stack (for scaffolding)

React 19, TypeScript strict, Vite 6+, Tailwind CSS v4 (via `@tailwindcss/vite`, not PostCSS), shadcn/ui (Base UI, `--base base`), TanStack Query v5, React Router v7, Vitest, pnpm 10.

**Never use npm or yarn — pnpm only.**

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
base: './',           // REQUIRED — relative paths for iframe embedding
outDir: '../portals', // build output goes here
```

### Runtime Config

Don't bake project IDs, model IDs, or module paths into the JS bundle. Fetch `config.json` at runtime from `client/public/config.json` (Vite copies it to `portals/`). `semoss_config/config.json` uses snake_case; `client/public/config.json` uses camelCase.

### Database Schemas

Schemas from `get_schema()` are Base64-encoded — decode before use. Write decoded schema to `semoss_config/` for reference.

## Build & Deploy

### Build
```bash
cd client && pnpm build
```

### Live deploy (sync script)
```bash
cd client && pnpm build && cd ..
python scripts/claude/semoss_asset_sync.py delete portals/assets --yes
python scripts/claude/semoss_asset_sync.py bulk-upload portals
```

**First deploy only:** skip the `delete` step — the remote path doesn't exist yet.

**Self-signed SSL certificates (preprod):** Add `--no-verify-ssl` flag:
```bash
python scripts/claude/semoss_asset_sync.py bulk-upload portals --no-verify-ssl
```

The sync script handles backup, upload, and publish. Don't try to replicate it with MCP tools directly.

### Submit for review (ai-repo)

`ai-repo` submits a zip into an approval pipeline — it does **not** publish the app to users.

```bash
# First time: register the app
ai-repo create-app --name "<name>" --business-unit "<team>" --description "<desc>"
# Save returned app_id to semoss_config/config.json

# Submit a version
cd client && pnpm build && cd ..
zip -r portals.zip portals/
ai-repo publish portals.zip --app <app_id> --notes "<notes>"
rm portals.zip

# Check status
ai-repo status --app <app_id>
```

`ai-repo` is usually already logged in. Only run `ai-repo login` if you get an auth error:
```bash
ai-repo login --base-url <base_url>/Monolith --access-key <key> --secret-key <key>
```

**Self-signed SSL certificates (preprod):** Prefix `ai-repo` commands with `NODE_TLS_REJECT_UNAUTHORIZED=0`:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 ai-repo create-app --name "..." --business-unit "..." --description "..."
NODE_TLS_REJECT_UNAUTHORIZED=0 ai-repo publish portals.zip --app <app_id> --notes "..."
```

## semoss_config/config.json Shape

```json
{
  "project_id": "",
  "app_id": "",
  "module": "/Monolith",
  "base_url": "https://your-instance.example.com/",
  "web_module_url": "/SemossWeb",
  "model_id": "",
  "database_id": "",
  "created_on": "",
  "ai_repo_base_url": "",
  "is_mcp": false
}
```

## MCP Servers

| Server | Purpose |
|--------|---------|
| `Semoss_Platform_Instructions` | Platform docs and guidance |
| `Semoss_project_manager` | Create projects, upload files, publish |
| `Semoss_database_helper` | Create/query databases, get schema |

### MCP Quirks

- **`create_project` always reports an error string** — even on success, the tool returns `"Could not determine project_id"`. The real project data (including `project_id`) is embedded in that message; parse it rather than treating it as a failure.
- **Project names must be unique** — `create_project` returns a hard error if the name already exists on the platform. Pick a unique name or check first.
- **Update `config.json` before running the sync script** — `semoss_asset_sync.py bulk-upload` reads `project_id` from `semoss_config/config.json`. When creating a new project, update that file with the new `project_id` before uploading, or files will go to the wrong project.

## URL Patterns

| Purpose | Pattern |
|---------|---------|
| App view | `<base_url><web_module_url>/packages/client/dist/#/app/<project_id>/view` |
| Database | `<base_url><web_module_url>/packages/client/dist/#/engine/database/<database_id>` |

## Tagging

After publishing, tag via MCP: `attach_tag(project_id, tag)`. Common tags: `approval-pending`, `approved`, `draft`, `deprecated`. Confirm with the user before applying.
