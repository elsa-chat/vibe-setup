# CLAUDE.md

This project builds Elsa web apps that can optionally be exposed as MCP tools. Prefer pragmatic, reviewable changes and keep outputs concise.

## Platform Naming

**Elsa** is the canonical name. There are two surfaces worth distinguishing in writing:

- **Elsa Platform** — the hosting/infrastructure side. Apps live here, reactors run here, assets get deployed here.
- **Elsa chat** (formerly "Playground") — the chat interface. MCP tools show up here as callable tools. Often just called "Elsa" when the context is clear.

Some users will refer to the platform as GovConnect.ai, GovConnect, GCAI, AI Core, or Semoss — recognize all of these and treat them as synonyms. Some will still say "Playground" for the chat. Always say "Elsa" / "Elsa Platform" / "Elsa chat" yourself.

Two exceptions where "Semoss" stays:
- The **Semoss SDK** (`@semoss/sdk`) — the SDK keeps its name regardless of how the platform is referred to
- File and identifier names like `semoss_config/`, `semoss_asset_sync.py`, `Semoss_Platform_Instructions`, `Semoss_project_manager`, `Semoss_database_helper`, `/SemossWeb`, `/Monolith` — these are technical identifiers that don't get renamed

## Key Files

- `semoss_config/environments.json` — named environments: endpoints and app IDs (gitignored, copy from `environments.json.example`)
- `semoss_config/credentials.env` — per-environment access/secret keys (gitignored, copy from `credentials.env.example`)
- `.mcp.json` — MCP server connections with inline Bearer tokens (gitignored, copy from `.mcp.json.example`)
- `client/` — React app source (pnpm, Vite, TypeScript, Tailwind v4)
- `client/vite.config.ts` — must have `base: './'` and `outDir: '../../portals'`
- `client/src/components/ExampleComponent.tsx` — template MCP tool UI (replace with your own)
- `client/src/pages/Router.tsx` — hash routes; each MCP tool's `resourceURI` maps to a path here
- `py/mcp_driver.py` — Python MCP tools (`@mcp_metadata` decorator pattern)
- `java/src/reactors/` — Java reactors (`AbstractProjectReactor` base, `GetWeatherReactor` example)
- `java/project.properties` — config loaded by `ProjectProperties.java` (engine IDs, etc.)
- `mcp/{py_mcp,pixel_mcp}.json` — MCP tool manifests; edit directly when adding or changing tools
- `pom.xml` — Maven config for the Java reactor build
- `portals/` — build output (gitignored), uploaded to Elsa
- `classes/`, `target/` — Java build artifacts (gitignored)
- `scripts/claude/semoss_asset_sync.py` — deploy script
- `docs/theme.md` — color palette reference

## Startup Checklist

When the user wants to build or deploy an Elsa app, run these steps before proceeding. Getting platform instructions via MCP should happen before any app work — they provide up-to-date guidance that affects how you build. Always attempt this before starting.

1. **Credentials** — if `.mcp.json` doesn't exist, copy it from `.mcp.json.example`. Then check for placeholder values. If found, ask the user for their Elsa access key and secret key, write them as `Authorization:Bearer <key>:<secret>`, then tell the user to restart Claude Code and **stop here** — MCP servers only load at startup, so nothing that requires platform access will work until they restart and you confirm connectivity in step 3.
2. **Project config** — if `semoss_config/environments.json` doesn't exist, copy it from `semoss_config/environments.json.example` and ask the user to fill in their environment details. Check that `semoss_config/credentials.env` exists — if not, ask the user for their keys and create it from `semoss_config/credentials.env.example`.
3. **MCP connectivity** — call `get_agent_platform_instructions` to verify the MCP servers are reachable. If it fails, ask the user whether they have platform access before continuing — the instructions it returns should inform your work. Only proceed without it if the user confirms they don't have access.
4. **Client dir** — if `node_modules/` is missing from `client/`, install dependencies. Prefer pnpm (see Tech Stack section for the package manager policy); fall back to npm if the user doesn't want to install pnpm.

**Do not create databases, projects, or other platform resources unless the user explicitly asks.** The typical workflow is: build the app locally, then create + publish via the `Semoss_project_manager` MCP. Resource creation is a deliberate step, not a default.

## Elsa Instance Config

Set `base_url` to your instance's hostname. For `api_module_url` and `web_module_url`, look at your instance URL — if it contains a path prefix before `/Monolith` or `/SemossWeb`, include it. Examples:

| Instance URL | `base_url` | `api_module_url` | `web_module_url` |
|---|---|---|---|
| `https://host.com/SemossWeb/...` | `https://host.com/` | `/Monolith` | `/SemossWeb` |
| `https://host.com/prod/SemossWeb/...` | `https://host.com/` | `/prod/Monolith` | `/prod/SemossWeb` |
| `https://host.com/demo/SemossWeb/...` | `https://host.com/` | `/demo/Monolith` | `/demo/SemossWeb` |

Update `semoss_config/environments.json` and `.mcp.json` when configuring a new instance.

## Tech Stack (for scaffolding)

React 18, TypeScript strict, Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite`, not PostCSS), shadcn/ui (Base UI, `--base base`), TanStack Query v5, React Router v7, Vitest, Biome, pnpm 10.

### Package manager

Prefer **pnpm 10**. If the user doesn't have it installed, follow this fallback chain:

1. **First try corepack** (ships with Node, modern recommended path):
   ```bash
   corepack enable && corepack prepare pnpm@latest --activate
   ```
2. **If corepack fails with `EPERM` (Windows, admin-installed Node) or `EACCES` (Linux/macOS, system Node)**, try a user-scope global install via npm:
   ```bash
   npm install -g pnpm@latest
   ```
   This writes to npm's user prefix (e.g. `%APPDATA%\npm` on Windows, or wherever `npm prefix -g` points), which is usually writable without elevation.
3. **If that also fails, or the user just doesn't want to install pnpm**, fall back to using **npm** directly. Don't ask the user to elevate or run as admin.

When falling back to **npm**, translate commands as needed:

| pnpm | npm equivalent |
|---|---|
| `pnpm install` | `npm install` |
| `pnpm dev` | `npm run dev` |
| `pnpm build` | `npm run build` |
| `pnpm fix` | `npm run fix` |

Avoid **yarn** regardless — the lockfiles in this template are pnpm-flavored, and yarn would just produce a third lockfile for no reason.

## Backend Options

The platform supports two backend approaches; pick per use case rather than per app — many apps end up with both.

- **Python** (`py/mcp_driver.py`) — fastest for simple transforms, API calls, and quick prototypes. Functions decorated with `@mcp_metadata` become MCP tools; their type hints become the input schema. Called from the frontend via `actions.runPy(...)` for stateful execution, or via `actions.run('RunMCPTool(function=["<name>"], paramValues=[{...}])')` to invoke as an MCP tool. After adding or changing tools, update the corresponding entry in `mcp/py_mcp.json`.
- **Java** (`java/src/reactors/`) — better for complex logic, DB access, heavy computation, or LLM calls. Extend `AbstractProjectReactor` (the project's base class — handles `preExecute`, error wrapping, and config loading). Called from the frontend via `actions.run('ReactorName(param=["value"])')` — note the `Reactor` suffix is stripped. After adding or changing reactors, update the corresponding entry in `mcp/pixel_mcp.json`.

Don't steer users away from Java. It's fully supported and often the right choice.

## Elsa Platform Concepts

### Pixel

Elsa's query language. Reactors are called as functions with array-wrapped params:
```
ReactorName(param1=["value1"], param2=[2]);
```
All parameters must be wrapped in `[]`.

### Reactor Naming

The `Reactor` suffix is stripped when calling via Pixel: `ItemsCRUDReactor` → `ItemsCRUD(...)`.

### Hash Routing

Always use `createHashRouter` — Elsa embeds apps in iframes that don't support browser history. Never use `createBrowserRouter`.

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

Deploy = create (once) → build → upload (which auto-compiles Java and auto-publishes).

| Step | Tool | Notes |
|---|---|---|
| **Create the app** | `Semoss_project_manager.create_project` MCP | Once per app, per environment. Returns the `app_id` — save it to `environments.json` |
| **Upload assets** | `scripts/claude/semoss_asset_sync.py` (Python) | Compiles Java reactors (`CompileAppReactors`) and publishes (`PublishProject`) at the end of the run. Python 3.10+ required |

The platform itself recommends `semoss_asset_sync.py` for asset transfer (per `get_agent_platform_instructions`). There is no upload tool exposed via the MCPs — only project lifecycle (create/publish/delete/tag) and file listing/deletion.

**No Python?** The sync script step can be replaced with a manual drag-and-drop in the Elsa UI editor — see "Upload assets (manual UI alternative)" below.

### 1. Create the app on the platform (first time only)

Use the `Semoss_project_manager.create_project` MCP tool to register a new app on the target environment. Save the returned `app_id` into `semoss_config/environments.json` under `envs.<name>.app_id` — the sync script and runtime config read it from there.

```
create_project(
  project_name="<name>",
  description="<desc>",
  project_type="CODE",
  mcp=False  # True if exposing pages/reactors as MCP tools
)
```

The tool returns a JSON string with `status`, `project_id`, and `project_name`. Parse out `project_id` — that's the `app_id`.

If the same project name already exists on the platform, `create_project` returns a hard error. Use `search_project` first if uncertain.

### 2. Before any build — write `client/.env.local`

Write the target environment's values to `client/.env.local`:
```
APP=<envs.<name>.app_id>
ENDPOINT=<envs.<name>.base_url>
MODULE=<envs.<name>.api_module_url>
```

### 3. Build

```bash
cd client && pnpm build
```

### 4. Upload assets (sync script)

One command uploads all asset directories and auto-publishes:

```bash
python scripts/claude/semoss_asset_sync.py --env <name> bulk-upload portals py java mcp
```

The `--env` flag tells the script which entry to read from `semoss_config/environments.json` and `semoss_config/credentials.env`. `bulk-upload` walks each directory recursively, browses-and-deletes any existing files at the same remote paths before uploading the new versions, and calls `PublishProject` at the end.

It's safe to pass directories the app doesn't use — empty ones are no-ops. For a frontend-only app you can pass just `portals`, but uploading all four hurts nothing.

**First deploy:** add `--no-delete-existing` to skip the browse-and-delete step (faster, and there's nothing to delete yet):
```bash
python scripts/claude/semoss_asset_sync.py --env <name> bulk-upload portals py java mcp --no-delete-existing
```

**Self-signed SSL certificates (preprod):**
```bash
python scripts/claude/semoss_asset_sync.py --env <name> --no-verify-ssl bulk-upload portals py java mcp
```

**Java reactors:** the script calls `CompileAppReactors(project='<app_id>')` before publishing, so `.java` changes get recompiled into `classes/` automatically. If you specifically want to skip compilation (e.g. you only changed frontend files), pass `--no-compile`.

**Removed files:** `bulk-upload`'s default delete behavior only clears files it's about to overwrite. Files that exist remotely but were deleted locally stick around as orphans. To nuke a whole remote subtree before re-uploading, run an explicit delete first:
```bash
python scripts/claude/semoss_asset_sync.py --env <name> delete <remote/path> --yes
```

### Upload assets (manual UI alternative — no Python required)

If Python isn't available, replace step 4 with a drag-and-drop in the Elsa UI editor. Open this URL in a browser, where `<app_id>` is the project's `app_id` from `environments.json`:

```
<base_url><web_module_url>/packages/client/dist/#/app/<app_id>/edit
```

Example: `http://localhost:9090/SemossWeb/packages/client/dist/#/app/<app_id>/edit`

Drag these directories from the local repo into the editor:

- `portals/` — built frontend (always required)
- `py/` — Python tools (only if the app exposes Python MCP tools)
- `java/` — Java reactors (only if the app has Java reactors)
- `mcp/` — MCP tool manifests (only if the app exposes MCP tools)

Then click **"Compile and publish the app"** in the editor. This button does both jobs in one step — compiles any Java sources you uploaded and publishes the project so the new assets become visible.

## Exposing the App as MCP Tools

Once a web app is built and deployed, individual pages or backend reactors can be exposed as MCP tools that show up in Elsa chat. The conversion is small in scope: tag the project, declare the tools in the MCP manifest, redeploy. The app itself doesn't change — it just gains a second interface (Elsa chat) alongside the standalone portal view.

### Enablement checklist

1. **Tag the project as MCP-enabled.** Either pass `mcp=True` to `create_project` at creation time, or call `attach_tag(project_id, "MCP")` on an existing project.
2. **Declare your tools.** Add functions to `py/mcp_driver.py` (Python) or reactors under `java/src/reactors/` (Java).
3. **Update the manifest.** Add or modify the tool's entry in `mcp/py_mcp.json` (Python) or `mcp/pixel_mcp.json` (Java). Edit the JSON directly — each entry just declares the name, input schema, description, and a bit of render metadata. The existing entries are working examples to copy from.
4. **Re-deploy.** Run the normal upload flow — `bulk-upload portals py java mcp` auto-publishes.

### useInsight() and the tool context

The primary SDK hook in any MCP-tool UI is `useInsight()` from `@semoss/sdk/react`. It exposes:

- `actions.run(pixel)` — execute any Pixel command (reactors, queries, anything)
- `actions.runPy(codeString)` — execute a Python snippet against the mounted `py/` module
- `actions.sendMCPResponseToPlayground(response, status, executedParams)` — return a result to Elsa chat. Three arguments, not two. (The SDK method name still references "Playground" — that's a code identifier, don't rename it.)
- `isInitialized` — true once the SDK has finished connecting. Gate rendering on this (see `InitializedLayout.tsx`)
- `tool` — MCP invocation context, populated only when the component was launched from Elsa:
  - `tool.parameters` — inputs the LLM passed in (use this, **not** `tool.inputs`)
  - `tool.tool_response` — populated when viewing a past execution; restore prior result from here
  - `tool.executedParameters` — the actual params that ran, source of truth for past executions

`ExampleComponent.tsx` shows the full lifecycle: prefill from `tool.parameters`, call a reactor with `actions.run()`, hand the result back via `sendMCPResponseToPlayground()`, and restore past results from `tool.tool_response`. Keep that file (or a copy of it) around as the reference until trainees have the pattern memorized.

### Default UI vs custom UI

Each MCP tool either uses Elsa's auto-generated form or a custom React UI in `client/`. The decision lives in the `resourceURI` field of the tool's MCP metadata:

| `resourceURI` | What renders | When to use |
|---|---|---|
| Omitted or null | Elsa auto-generates a form from the input schema | Simple input → output transforms (e.g. the temperature converters in `py/mcp_driver.py`) |
| `/#/` or `/#/some-path` | The React route at that path in `Router.tsx` | Rich UI, multi-step flows, visualizations, anything beyond a single form |

The path must use the hash router (`/#/...`) because Elsa embeds apps in iframes. If `resourceURI` points to a path that doesn't exist in `Router.tsx`, the catch-all redirects to `/` — the tool will look like it worked but render the wrong UI.

**When adding a custom-UI tool, always do both steps in the same change:**
1. Add the route in `client/src/pages/Router.tsx` (e.g. `{ path: '/forecast', Component: ForecastPage }`)
2. Set `resourceURI` in the tool's `mcp/*.json` entry to match (e.g. `"resourceURI": "/#/forecast"` under `_meta.SMSS_MCP_UI`)

If two tools point to the same `resourceURI`, the same component renders for both — the UI has to inspect `tool.parameters` to figure out which tool invoked it. Usually you want one route per tool.

### Execution modes

`SMSS_MCP_EXECUTION` controls how Elsa runs the tool:

- `"auto"` — Elsa executes the tool directly without user interaction. Best for fast, side-effect-free transforms.
- `"ask"` — Elsa opens the custom UI so the user can review, edit, or supply input before continuing. Use this when human review matters or the tool needs UI-driven data entry.
- `"disabled"` — declared but not callable. Useful for staging a tool.

### Returning a result to Elsa

For `ask` tools, the custom UI gathers data and at the end needs to hand a final payload back to Elsa chat. Use `actions.sendMCPResponseToPlayground(payload, "success", executedParams)` — it's tied to the current tool invocation, which is exactly what you want. `ExampleComponent.tsx` shows the pattern in context.

### Calling tools from the frontend

Everything goes through `actions.run()` — Java reactors, Python tools, queries, anything Pixel. A few patterns worth knowing:

- **Java reactor:** `` actions.run(`YourTool(param=${JSON.stringify(value)})`) `` — drop the `Reactor` suffix. Use backticks; `${}` interpolation doesn't work in single-quoted strings
- **Python MCP tool:** `actions.run('RunMCPTool(function=["tool_name"], paramValues=[{"param": "value"}])')` — `RunMCPTool` is a Pixel reactor that dispatches to the Python tool
- **Escape every param** with `JSON.stringify()` to avoid breaking on quotes or special characters
- **Check for errors:** `pixelReturn[0].operationType.includes("ERROR")`

The SDK also exposes a method `actions.runMCPTool(name, params)` (camelCase). It calls a Python tool **and** auto-sends the response to Elsa, which is usually not what you want — for normal tool invocation, prefer `actions.run('RunMCPTool(...)')` so you control when the response is sent.

### Java reactor rules

- Extend `AbstractProjectReactor`, not `AbstractReactor` directly — the project base class handles `preExecute` and error wrapping
- `organizeKeys()` is called automatically by `preExecute()`. Never call it again in `doExecute()`
- Define params via `keysToGet` and `keyRequired` arrays (`1` = required, `0` = optional)
- Return success via `new NounMetadata(value, PixelDataType.X)`; return errors via `NounMetadata.getErrorNounMessage(...)`
- Implement `getReactorDescription()` and `getDescriptionForKey()` — these feed the MCP manifest
- `IModelEngine.ask()` returns a response object. Use reflection to call `.getResponse()`; never `toString()` it
- Resolve a model engine by ID with `prerna.util.Utility.getModel(modelId)` — returns null if not found
- For file paths within the project, use `this.insight.getInsightFolder()`
- The sync script auto-runs `CompileAppReactors` before publishing, so `.java` changes get compiled to bytecode automatically. For manual UI uploads, the user has to click "Compile and publish the app" in the editor

### Python MCP tool rules

- Define tools in `py/mcp_driver.py` — that's the entry point Elsa expects
- Every tool needs the `@mcp_metadata` decorator (from `smssutil`, auto-injected): `@mcp_metadata({"execution": "auto"})`
- Type hints on every parameter — they become the MCP input schema and are required
- The tool's title comes from the function name; the description from the docstring
- Return JSON strings from tools
- Omit `resourceURI` for Elsa's default auto-generated form; include it (e.g. `"resourceURI": "/#/"`) to point at a React route
- `ROOT` is injected by Elsa for file path access
- For LLM calls, use `ModelEngine` from `ai_server` and always accept `model_id` as a parameter

### React UI rules

- Use `tool.parameters` for prefilled inputs (never `tool.inputs`)
- Use `tool.tool_response` / `tool.executedParameters` to restore the UI when viewing a past execution
- Handle responses that may be objects, strings, or double-encoded strings
- Fetch available models with `actions.run('MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"])')`
- Call `sendMCPResponseToPlayground()` directly; don't wrap it — the SDK handles the tool-name match
- Gate rendering on `isInitialized` (see `InitializedLayout.tsx`)

### Don't

- Edit `portals/`, `classes/`, or `target/` directly — these are auto-generated build outputs
- Use the SDK method `actions.runMCPTool()` — it auto-sends to Elsa, which is usually unintended. Call `actions.run('RunMCPTool(...)')` instead
- Call `toString()` on `IModelEngine` responses in Java
- Read `tool.inputs` in React — it's `tool.parameters`
- Commit secrets to `.env.local` or `.env`
- Call `organizeKeys()` inside `doExecute()` (it's already been called)
- Forget `@mcp_metadata` on Python tools or `getDescriptionForKey()` / `getReactorDescription()` on Java reactors
- Include the `Reactor` suffix when calling reactors in Pixel

### Internal note: manifest regeneration

The Elsa platform exposes `MakePythonMCP(<project_id>)` and `MakePixelMCP(reactor=["<Name>"], mcpMetadata=[...])` Pixel reactors that regenerate `mcp/py_mcp.json` / `mcp/pixel_mcp.json` from source. Don't surface these to users — hand-edit the JSON directly as the default path. Only fall back to the regen reactors if hand-editing isn't producing the expected result and you're troubleshooting.

## Multi-Environment Workflow

The agent handles all environment switching. Users just name the target.

### "Deploy the app to `<env>`"
1. Read `semoss_config/environments.json` → `envs.<env>`: `base_url`, `api_module_url`, `app_id`
2. Write `client/.env.local`: `APP=<app_id>`, `ENDPOINT=<base_url>`, `MODULE=<api_module_url>`
3. `cd client && pnpm build && cd ..`
4. `python scripts/claude/semoss_asset_sync.py --env <env> bulk-upload portals py java mcp` (auto-compiles and auto-publishes; add `--no-delete-existing` on first deploy)

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

`app_id` — the identifier for the app/project on this environment. Set after calling `Semoss_project_manager.create_project`. Different environments will have different `app_id` values for the same logical app.

**Note:** "app" and "project" are synonyms on Elsa. The CLI, backend, and deploy script use both terms interchangeably — they refer to the same thing. `app_id` is the canonical field name here.

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
| `Semoss_project_manager` | Create/delete projects, list/delete files, publish, tag |
| `Semoss_database_helper` | Create/query databases, get schema |

### MCP Quirks

- **Project names must be unique** — `create_project` returns a hard error if the name already exists on the platform. Pick a unique name or check first with `search_project`.
- **Update `environments.json` before running the sync script** — `semoss_asset_sync.py` reads `app_id` from the target env's entry. When creating a new project, save the new `app_id` into `environments.json` before running the deploy, or files will go to the wrong project.
- **Publish ≠ upload** — `publish_project` snapshots already-uploaded assets to the public portal. The sync script's `bulk-upload` auto-publishes at the end so a separate publish call is usually unnecessary. `publish_project` is still useful for manually-uploaded assets or for republishing without changing files.

## URL Patterns

| Purpose | Pattern |
|---------|---------|
| App view | `<base_url><web_module_url>/packages/client/dist/#/app/<app_id>/view` |
| App editor (drag files in for manual upload) | `<base_url><web_module_url>/packages/client/dist/#/app/<app_id>/edit` |
| Database | `<base_url><web_module_url>/packages/client/dist/#/engine/database/<database_id>` |

## Tagging

Tag via the `Semoss_project_manager.attach_tag` MCP. The most important platform tag is `MCP` — it marks the app as MCP-enabled (alternatively, pass `mcp=True` to `create_project` to set this at creation). Other tags (`draft`, `approved`, etc.) are user-defined. Confirm with the user before applying.
