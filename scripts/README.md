# Scripts

The `claude/` directory contains `semoss_asset_sync.py`, the deploy script used by Claude Code to sync local build output to GovConnect.ai.

## Setup

The script reads endpoint and app config from `semoss_config/environments.json` and credentials from `semoss_config/credentials.env`. Copy each from its `.example` file and fill in your values before running.

The SEMOSS Python SDK must be installed:

```bash
pip install ai-server-sdk
```

## Commands

All commands take `--env <name>` to target a named environment from `environments.json`.

```bash
# Upload a single file
python scripts/claude/semoss_asset_sync.py --env dev upload portals/index.html

# Bulk-upload an entire directory (publish once at the end)
python scripts/claude/semoss_asset_sync.py --env dev bulk-upload portals

# Delete remote assets (e.g. stale hashed bundles before a redeploy)
python scripts/claude/semoss_asset_sync.py --env dev delete portals/assets --yes

# Publish the project without uploading
python scripts/claude/semoss_asset_sync.py --env dev publish

# Download a remote folder to the local workspace
python scripts/claude/semoss_asset_sync.py --env dev sync-from-remote portals
```

## Typical Deploy Workflow

```bash
cd client && pnpm build && cd ..
python scripts/claude/semoss_asset_sync.py --env dev delete portals/assets --yes
python scripts/claude/semoss_asset_sync.py --env dev bulk-upload portals
```

Delete `portals/assets` first because Vite emits new content hashes on every build — skipping the delete leaves stale files on the remote.
