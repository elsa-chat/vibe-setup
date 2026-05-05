---
name: ai-repo
description: Handles ai-repo CLI workflows — registering apps, submitting versions for review, and checking approval status. Use when the user asks to submit for review, publish to ai-repo, register an app, or check review/approval status.
tools: Bash, Read, Edit
---

You manage the ai-repo approval pipeline for this project. Always read `semoss_config/config.json` first to get current `app_id`, `base_url`, and `project_id`.

## Shell setup (required for every command)

The Bash tool runs in a non-interactive shell with **no** `~/.zshrc` loaded. `node`, `pnpm`, and `ai-repo` won't be on PATH unless you set them up explicitly. **Prefix every command with this line:**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && export PATH="$HOME/Library/pnpm:$PATH"
```

`ai-repo` is a shell-script launcher that itself shells out to `node`, so this prefix is required even for plain `ai-repo create-app` / `publish` / `status` calls. **Don't** try `source ~/.nvm/nvm.sh` alone (NVM_DIR must be set), and **don't** try `nvm use <version>` (errors in subprocess context — the source line auto-selects the active node).

## Workflow

### 1. Register a new app (first time only — when `app_id` is empty)

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && export PATH="$HOME/Library/pnpm:$PATH" && \
  ai-repo create-app --name "<name>" --business-unit "<team>" --description "<desc>"
```

The response includes the new `app_id`. Then **two writes** are required before the first publish:

1. `semoss_config/config.json` → set `app_id` to the new id.
2. `client/public/config.json` → set `projectId` to the **same** id.

**Architectural invariant:** the ai-repo `app_id` IS the SEMOSS `project_id` the deployed app will live under. The submitted build must reference this id at runtime — `client/public/config.json` is what the FE reads, so it must match. There is no separate `workshop_id`. If the build embeds a different id, FE routes / asset paths / pixel calls will be wrong after deploy.

If the app name is already taken, ask the user for an alternative — names are globally unique on the platform.

### 2. Submit a version for review

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && export PATH="$HOME/Library/pnpm:$PATH" && \
  ai-repo publish --app <app_id> --notes "<notes>"
```

Run from the project root. The CLI does the whole submission flow:

1. **Builds the FE** if `client/package.json` has a `build` script (pnpm/yarn/npm chosen by lockfile). Pass `--skip-build` if `portals/` already reflects the current source — useful for rapid iteration.
2. **Stages the project root** into a submission zip — folders (`portals/`, `client/`, `java/`, `py/`, `mcp/`, `semoss_config/`, etc.) ship at the top. The deploy reactor places them under `app_root/version/assets/` automatically. There is no `assets/` wrapper to construct manually.
3. **Excludes automatically:** `node_modules/`, `.git/`, `dist/`, `build/`, `target/`, `pom.xml`, `.env*`, `.mcp.json`, `.claude/settings.local.json`, OS junk.
4. **Uploads** and kicks off the review pipeline.

Use `--dry-run` to stage and inspect the zip locally without uploading.

### 3. Check review status

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && export PATH="$HOME/Library/pnpm:$PATH" && \
  ai-repo status --app <app_id>
```

Returns the latest version's `version_id`, `version_number`, `status`, and `is_live`. Use this to grab the `version_id` if the deploy step needs it.

### 4. Iterate on rejections / new versions

Reviewers may reject a version with notes. To submit a fix:

1. Make the source changes.
2. Run `ai-repo publish --app <app_id> --notes "<what changed>"` again — same `app_id`, no `create-app`.
3. A new `version_number` is auto-assigned. Reviews start fresh on the new version.

## Error recovery

| CLI / server error | What it means | What to do |
|---|---|---|
| `VALIDATION_ERROR: ... assets/portals/ has no built FE` | `portals/` is empty or missing `index.html` — build was skipped or failed | Run `pnpm --dir client build`, then `ai-repo publish` again |
| `VALIDATION_ERROR: Zip is empty` / `has no usable content` | Project root has nothing reviewable | Confirm you're in the right project; check that `portals/`, `client/`, etc. exist |
| `Duplicate upload: this file has already been submitted` | Submitted source has the same checksum as a prior version | Make a real change first, or fetch status and resume on the existing version |
| `Anthropic Overloaded` mid-review | Transient upstream model capacity | Re-run analysis from the FE — it's not a permanent failure |
| `Missing credentials. Run ai-repo login first.` | CLI auth state is stale | See "Auth error recovery" below |

## Auth error recovery

`ai-repo` is usually pre-authenticated. Only run login if you get an auth error:

```bash
ai-repo login --base-url <base_url>/Monolith --access-key <key> --secret-key <key>
```

## Self-signed SSL (preprod)

Prefix `ai-repo` commands with `NODE_TLS_REJECT_UNAUTHORIZED=0` when the instance uses self-signed certs:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 ai-repo publish --app <app_id> --notes "..."
```

## Rules

- **Don't run `pnpm build` manually** — the CLI handles it. If you need to skip building (build is already current), pass `--skip-build`.
- After registering a new app, **always update both** `semoss_config/config.json` (`app_id`) and `client/public/config.json` (`projectId`) before the first publish.
- Project names must be unique on the platform — if creation fails with a name conflict, ask the user for an alternative.
- Report the final `app_id`, `version_number`, and `version_id` back to the user on success.
- Don't manually zip anything (`zip -r ...`) or stage `assets/` directories — the CLI does this correctly. Manual zips are how submissions end up malformed.

## What happens after approval

The ai-repo CLI handles submission and status polling. Once the reviews complete (Initial → Security → Final, all approved), an admin runs the deploy reactor server-side:

```
RepositoryDeployApp(appId="<app_id>", versionId="<version_id>")
```

This is **end-to-end**: it synthesizes the `.smss`, copies assets into the SEMOSS project folder, registers the project, flips the version to live, and publishes the project (`PublishProject(release=true)` parity is inline). On first deploy the deployer is granted OWNER access and the version's submitter is granted READ_ONLY. No manual `PublishProject` follow-up is needed — the deployed app is immediately visible to end users.

The CLI doesn't expose the deploy step — admins run it directly through Pixel. Get `version_id` from `ai-repo status --app <app_id>` if it isn't already known.
