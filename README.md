# GovConnect.ai Vibe Coding Setup

A template for building GovConnect.ai web applications with Claude Code. **Clone this repo once per application** — each clone becomes an independent project.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  client/         React 18 SPA                            │
├──────────────────────────────────────────────────────────┤
│  portals/        Build output (deployed to GovConnect.ai)│
├──────────────────────────────────────────────────────────┤
│  GovConnect.ai Platform  (remote host, DB, LLM, SDK)     │
└──────────────────────────────────────────────────────────┘
```

**Data flow:** Page → Hook → Service → `runPixel()` → GovConnect.ai SDK → Java Reactor → Database

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
| pnpm | 10.x | `corepack enable && corepack prepare pnpm@latest --activate` |
| Python | 3.10+ | Pre-installed on most systems |
| Claude Code | latest | [claude.ai/code](https://claude.ai/code) |

## Directory Guide

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code instructions — scaffolding, conventions, full React workflow |
| `.mcp.json.example` | MCP config template — copy to `.mcp.json` and add credentials |
| `semoss_config/environments.json.example` | Environment config template — copy to `environments.json` and fill in your instance |
| `semoss_config/credentials.env.example` | Credentials template — copy to `credentials.env` and fill in your keys |
| `scripts/claude/` | Deploy script (`bulk-upload`, `delete`, `publish`) |
| `docs/theme.md` | Color palette reference |
| `client/` | React 18 SPA |
| `portals/` | Build output (gitignored) — deployed to GovConnect.ai |

## Development

```bash
cd client
pnpm install        # Install dependencies (pnpm only)
pnpm dev        # Dev server with HMR
pnpm build      # Type-check + build to portals/
pnpm fix        # Lint & format (Biome)
pnpm test:run   # Run tests
```

Tech stack: React 18, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Router v7, Biome.

## Deploy

```bash
cd client && pnpm build && cd ..
python scripts/claude/semoss_asset_sync.py --env <name> delete portals/assets --yes
python scripts/claude/semoss_asset_sync.py --env <name> bulk-upload portals
```

`<name>` matches an entry in `semoss_config/environments.json` (e.g. `dev`, `prod`).

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

## GovConnect.ai URLs

| Purpose | URL |
|---------|-----|
| App view | `<base_url><web_module_url>/packages/client/dist/#/app/<app_id>/view` |
| Database | `<base_url><web_module_url>/packages/client/dist/#/engine/database/<database_id>` |

`app_id` comes from `semoss_config/environments.json` for the target environment.
