# GovConnect.ai Vibe Coding Setup

A template for building GovConnect.ai web applications with Claude Code. **Clone this repo once per application** — each clone becomes an independent project.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  client/         React SPA (scaffolded by Claude Code)   │
├──────────────────────────────────────────────────────────┤
│  portals/        Build output (deployed to GovConnect.ai)       │
├──────────────────────────────────────────────────────────┤
│  GovConnect.ai Platform  (remote host, DB, LLM, SDK)            │
└──────────────────────────────────────────────────────────┘
```

**Data flow:** Page → Hook → Service → `runPixel()` → GovConnect.ai SDK → Java Reactor → Database

## Quick Start

```bash
git clone <repo-url> my-semoss-app && cd my-semoss-app
export GovConnect.ai_ACCESS_KEY="your-access-key"
export GovConnect.ai_SECRET_KEY="your-secret-key"
claude
```

Claude Code reads `.mcp.json` automatically and resolves `${env:GovConnect.ai_ACCESS_KEY}` at startup.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.19+ | [nodejs.org](https://nodejs.org) or `brew install node` |
| pnpm | 10.x | `corepack enable && corepack prepare pnpm@latest --activate` |
| Python | 3.10+ | Pre-installed on most systems |
| GovConnect.ai SDK | latest | `pip install ai-server-sdk` |
| Claude Code | latest | [claude.ai/code](https://claude.ai/code) |

## Directory Guide

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code instructions — scaffolding, conventions, full React workflow |
| `.mcp.json` | MCP config (3 GovConnect.ai servers, `${env:VAR}` credentials) |
| `semoss_config/config.json` | GovConnect.ai project metadata (project ID, module, database ID) |
| `scripts/claude/` | Deploy script (`bulk-upload`, `delete`, `publish`) |
| `docs/theme.md` | Hula-inspired color palette reference |
| `client/` | React 19 SPA (scaffolded by Claude Code) |
| `portals/` | Build output (gitignored) — deployed to GovConnect.ai |
| `.env.example` | Environment variable template |

## Development

Once the React app is scaffolded in `client/`:

```bash
cd client
pnpm install        # Install dependencies (pnpm only)
pnpm run dev        # Dev server with HMR
pnpm run build      # Type-check + build to ../portals/
pnpm run check:fix  # Lint & format (Biome)
pnpm run test:run   # Run tests
```

Tech stack: React 19, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui (Base UI), TanStack Query v5, React Router v7, Biome.

## Deploy

```bash
cd client && pnpm run build && cd ..
python scripts/claude/semoss_asset_sync.py delete portals/assets --yes
python scripts/claude/semoss_asset_sync.py bulk-upload portals
```

See [scripts/README.md](scripts/README.md) for all commands, flags, and workflows.

## Credentials

Set `GovConnect.ai_ACCESS_KEY` and `GovConnect.ai_SECRET_KEY` as environment variables. The `.mcp.json` file references them via `${env:VAR}` syntax — Claude Code resolves these at MCP server startup.

If MCP tools stop working, check that credentials are still valid and restart Claude Code.

## Multiple Applications

Each app gets its own clone:

```bash
git clone <repo-url> inventory-app    # App 1
git clone <repo-url> dashboard-app    # App 2
```

Each clone maintains its own project ID, `client/` source, and git history.

## GovConnect.ai URLs

| Purpose | URL |
|---------|-----|
| App view | `<base_url><web_module_url>/packages/client/dist/#/app/<project_id>/view` |
| Database maker | `<base_url><web_module_url>/packages/client/dist/#/app/<database_app_id>/view` |

Replace `<project_id>` with the value from `semoss_config/config.json`.
