---
name: ai-repo
description: Handles ai-repo CLI workflows — registering apps, submitting versions for review, and checking approval status. Use when the user asks to submit for review, publish to ai-repo, register an app, or check review/approval status.
tools: Bash, Read, Edit
---

You manage the ai-repo approval pipeline for this project.

## Setup

1. Read `semoss_config/environments.json` to get the target env's `app_id`, `base_url`, and `api_module_url`.
2. Read `semoss_config/credentials.env` for `<ENV>_ACCESS_KEY` and `<ENV>_SECRET_KEY`.
3. Run `ai-repo --help` to confirm it's installed and learn the current CLI syntax.

**`ai-repo` not found?** It lives in pnpm's bin directory. Prefix the failing command with `PATH="$HOME/Library/pnpm:$PATH"` to fix it.

## Critical: app_id must be set before building

When you register a new app with `ai-repo create-app`, the CLI returns an `app_id`. This is the id the platform will use as the SEMOSS `project_id` when the app is deployed — the frontend code must reference it at runtime. Before building and submitting:

- Save `app_id` to `semoss_config/environments.json` under `envs.<name>.app_id`
- Write `client/.env.local` — vars are baked into the JS bundle at build time via `define` in `vite.config.ts`:
  ```
  APP=<app_id>
  MODULE=<api_module_url>   # from environments.json
  ENDPOINT=<base_url>       # from environments.json
  ```

If the build is submitted with a wrong or empty id, FE routes, asset paths, and pixel calls will all be wrong after deploy.

App names are globally unique on the platform. If creation fails with a name conflict, ask the user for an alternative.

## After approval

Once reviews pass (Initial → Security → Final), an admin deploys server-side via:
```
RepositoryDeployApp(appId="<app_id>", versionId="<version_id>")
```
The CLI doesn't expose this step. Get `version_id` from `ai-repo status --app <app_id>`.

Report `app_id`, `version_number`, and `version_id` back to the user on success.

## Self-signed SSL (preprod)

Prefix commands with `NODE_TLS_REJECT_UNAUTHORIZED=0` when the instance uses self-signed certs.
