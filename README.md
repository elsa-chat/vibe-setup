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
2. Add your GovConnect.ai access key and secret key to `.mcp.json` as `Authorization: Bearer <key>:<secret>`
3. Restart Claude Code so the MCP servers pick up the credentials
4. Ask Claude to build your app

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
| `.mcp.json` | MCP config (3 GovConnect.ai servers, inline Bearer credentials) |
| `semoss_config/config.json` | GovConnect.ai project metadata (project ID, module, database ID) |
| `scripts/claude/` | Deploy script (`bulk-upload`, `delete`, `publish`) |
| `docs/theme.md` | Hula-inspired color palette reference |
| `client/` | React 18 SPA |
| `portals/` | Build output (gitignored) — deployed to GovConnect.ai |

## Development

```bash
cd client
pnpm install        # Install dependencies (pnpm only)
pnpm dev        # Dev server with HMR
pnpm build      # Type-check + build to ../portals/
pnpm fix        # Lint & format (Biome)
pnpm test:run   # Run tests
```

Tech stack: React 18, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Router v7, Biome.

## Deploy

```bash
cd client && pnpm build && cd ..
python scripts/claude/semoss_asset_sync.py delete portals/assets --yes
python scripts/claude/semoss_asset_sync.py bulk-upload portals
```

## Credentials

Open `.mcp.json` and replace the placeholder `Authorization` header value with `Bearer <your-access-key>:<your-secret-key>`, then restart Claude Code. MCP servers only load credentials at startup.

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
