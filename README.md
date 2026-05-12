# Elsa Vibe Coding Setup

A template for building web apps on the Elsa Platform with Claude Code. The apps can optionally be exposed as MCP tools that show up in Elsa chat — same codebase, just additional metadata declaring which pieces are tools. **Clone this repo once per application** — each clone becomes an independent project.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  client/         React 18 SPA                            │
│  py/             Python MCP tools (optional)             │
│  java/           Java reactors (optional)                │
├──────────────────────────────────────────────────────────┤
│  portals/        Built frontend (deployed to platform)   │
│  mcp/            MCP tool manifests                      │
│  classes/        Compiled Java (auto-generated)          │
├──────────────────────────────────────────────────────────┤
│  Elsa Platform  (host, DB, LLM, Semoss SDK, Elsa chat)   │
└──────────────────────────────────────────────────────────┘
```

**Web app flow:** Page → Hook → Service → `actions.run()` → Semoss SDK → Reactor → Database
**MCP tool flow:** Elsa chat → MCP tool → custom React UI (or auto-form) → `sendMCPResponseToPlayground()`

## Quick Start

1. Clone this repo and open it in Claude Code
2. Copy `.mcp.json.example` → `.mcp.json` and fill in your access key and secret key
3. Copy `semoss_config/environments.json.example` → `semoss_config/environments.json` and fill in your instance URL
4. Copy `semoss_config/credentials.env.example` → `semoss_config/credentials.env` and fill in your keys
5. Restart Claude Code so the MCP servers pick up the credentials
6. Ask Claude to build your app

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.19+ | [nodejs.org](https://nodejs.org) or `brew install node` |
| pnpm | 10.x | `corepack enable && corepack prepare pnpm@latest --activate` (recommended; npm works too — see Development) |
| Python | 3.10+ | Pre-installed on most systems. Only needed for the deploy script — see the no-Python path under Deploy |
| Claude Code | latest | [claude.ai/code](https://claude.ai/code) |

## Directory Guide

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code instructions — scaffolding, conventions, MCP patterns |
| `.mcp.json.example` | MCP config template — copy to `.mcp.json` and add credentials |
| `semoss_config/environments.json.example` | Environment config template — copy to `environments.json` and fill in your instance |
| `semoss_config/credentials.env.example` | Credentials template — copy to `credentials.env` and fill in your keys |
| `scripts/claude/` | Deploy script (`bulk-upload`, `delete`, `publish`) |
| `docs/theme.md` | Color palette reference |
| `client/` | React 18 SPA — web app pages and custom MCP tool UIs |
| `py/mcp_driver.py` | Python MCP tools — `@mcp_metadata` decorated functions |
| `java/src/reactors/` | Java reactors — extend `AbstractProjectReactor` |
| `java/README.md` | Java reactor reference |
| `mcp/` | MCP tool manifests (edit directly when adding or changing tools) |
| `pom.xml` | Maven build for Java reactors |
| `portals/` | Build output (gitignored) — deployed to the Elsa Platform |

## Development

```bash
cd client
pnpm install    # Install dependencies
pnpm dev        # Dev server with HMR
pnpm build      # Type-check + build to portals/
pnpm fix        # Lint & format (Biome)
pnpm test:run   # Run tests
```

pnpm is recommended (the lockfile in `client/` is `pnpm-lock.yaml`). If you don't have pnpm and don't want to install it, npm works — just translate the commands (`npm install`, `npm run dev`, `npm run build`, etc.).

Tech stack: React 18, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Router v7, Biome.

## MCP Tools

Exposing functionality as MCP tools is mostly a declaration step on top of code you already have.

**Python tools** live in `py/mcp_driver.py`. Decorate any function with `@mcp_metadata({...})` and Elsa picks it up. Type hints become the input schema; the docstring becomes the description. Two examples ship in the template — replace them with your own.

**Java tools** are reactors under `java/src/reactors/` that extend `AbstractProjectReactor`. The included `GetWeatherReactor` is a working example.

**Declare your tools in the manifest.** Add or update entries in `mcp/py_mcp.json` (Python tools) or `mcp/pixel_mcp.json` (Java reactors), then redeploy. Each tool entry lists the function name, input schema, description, and a bit of metadata about how Elsa should render it. The existing entries are working examples to copy from.

Each tool can render with either Elsa's auto-generated form (simple input/output) or a custom React UI in `client/` (rich interaction). Custom UIs are wired by setting `resourceURI` in the manifest entry to a hash route (e.g. `/#/forecast`) and adding the matching route in `client/src/pages/Router.tsx`. See `client/src/components/ExampleComponent.tsx` for the full custom-UI pattern.

Detailed patterns and rules (do/don't, `useInsight` hook, `sendMCPResponseToPlayground`, `tool.parameters`) are in `CLAUDE.md`.

## Deploy

Deploy = build → upload (which auto-publishes).

```bash
cd client && pnpm build && cd ..
python scripts/claude/semoss_asset_sync.py --env <name> bulk-upload portals py java mcp
```

`<name>` matches an entry in `semoss_config/environments.json` (e.g. `dev`, `prod`). First-time apps are created with `Semoss_project_manager.create_project` — save the returned `app_id` into `environments.json`. Add `--no-delete-existing` on the first deploy to skip the browse-and-delete pass.

The script auto-compiles Java reactors (via `CompileAppReactors`) and auto-publishes at the end, so a normal deploy is just the one command above. Pass `--no-compile` if you specifically want to skip compilation (e.g., when you only changed frontend files).

### No Python? Use the Elsa UI editor

If Python isn't available, skip the sync script and drag files in manually. Open the editor at:

```
<base_url><web_module_url>/packages/client/dist/#/app/<app_id>/edit
```

Drag in `portals/` (always), plus `py/`, `java/`, and `mcp/` if your app uses any of them. Then click **"Compile and publish the app"** in the editor — that one button compiles any Java sources and publishes the project so the new assets become visible.

## Credentials

Three files hold credentials — all are gitignored, copy each from its `.example`:

| File | What it stores |
|------|---------------|
| `.mcp.json` | Inline Bearer tokens for MCP servers (restart Claude Code after editing) |
| `semoss_config/credentials.env` | Per-environment access/secret key pairs for the deploy script |
| `semoss_config/environments.json` | Per-environment endpoints and app IDs |

If MCP tools stop working, check that credentials are still valid and restart Claude Code.

## Multiple Applications

Each app gets its own clone:

```bash
git clone <repo-url> inventory-app    # App 1
git clone <repo-url> dashboard-app    # App 2
```

Each clone maintains its own project ID, `client/` source, and git history.

## Elsa URLs

| Purpose | URL |
|---------|-----|
| App view | `<base_url><web_module_url>/packages/client/dist/#/app/<app_id>/view` |
| Database | `<base_url><web_module_url>/packages/client/dist/#/engine/database/<database_id>` |

`app_id` comes from `semoss_config/environments.json` for the target environment.
