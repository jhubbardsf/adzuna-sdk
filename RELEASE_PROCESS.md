# Release Process for adzuna-sdk

Releases are **fully automated** via the [`Release`](.github/workflows/release.yml) GitHub Action. You trigger it from the GitHub UI, the workflow does everything else: version bump, tests, build, tag, publish to npm, and create the GitHub release.

## One-Time Setup

You only need to do these steps once, when setting up the repo. **The release workflow uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers), so there is no `NPM_TOKEN` secret to manage** — npm authenticates each publish via GitHub's OIDC token, which is minted fresh per workflow run.

### 1. Create the GitHub repository

Push this repo to GitHub if you haven't already:

```bash
gh repo create jhubbardsf/adzuna-sdk --public --source=. --remote=origin --push
```

### 2. Claim the package name on npm (one-time manual publish)

If `adzuna-sdk` isn't on npm yet, you need an initial manual publish to claim the name. Trusted Publishing is configured *per package*, so the package must exist before npm will let you wire up the trust policy.

```bash
npm login
bunx tsc
npm publish --access public
```

This publishes whatever version is currently in `package.json` (e.g. `0.1.0`). Subsequent releases all go through the workflow — this is the only time you publish from your laptop.

### 3. Configure Trusted Publishing on npm

In the npm UI for the package:

1. Go to [npmjs.com/package/adzuna-sdk/access](https://www.npmjs.com/package/adzuna-sdk/access) (or **Package settings → Access**).
2. Click **Trusted Publisher → Add Trusted Publisher → GitHub Actions**.
3. Fill in:
   - **Repository owner**: `jhubbardsf`
   - **Repository name**: `adzuna-sdk`
   - **Workflow filename**: `release.yml`
   - **Environment**: leave blank (the workflow doesn't use a deployment environment)
4. Save.

From this point on, the `release.yml` workflow can publish to npm with no token. Any other workflow file, fork, or branch trying to publish under this package name will be rejected by npm's OIDC verifier.

## Cutting a Release

1. Make sure `main` contains the changes you want to ship. All CI checks should be green.
2. Go to **Actions → Release → Run workflow** in the GitHub UI.
3. Pick a branch (usually `main`) and fill in:
   - **version** — `patch`, `minor`, `major`, or an explicit semver like `1.2.3`.
   - **dry_run** — leave unchecked for a real release, check it to rehearse.
4. Click **Run workflow**.

The workflow will:

1. Install dependencies with Bun.
2. Run `tsc --noEmit` and `bun test`.
3. Build `dist/`.
4. Bump `package.json` to the new version.
5. Commit the bump as `chore(release): vX.Y.Z` and tag it `vX.Y.Z`.
6. Push the commit and tag back to the branch.
7. Publish to npm with provenance (`--provenance --access public`).
8. Create a GitHub Release with auto-generated notes from commits since the previous tag.

Total run time is typically 1-2 minutes.

## Versioning Policy

Follow [semver](https://semver.org):

- **patch** (`0.1.0 → 0.1.1`) — bug fixes, no behavior change for existing users.
- **minor** (`0.1.1 → 0.2.0`) — new endpoints, new optional parameters, new exports.
- **major** (`0.2.0 → 1.0.0`) — breaking changes to existing APIs, removed exports, changed response shapes.

Use [conventional commit prefixes](https://www.conventionalcommits.org) (`feat:`, `fix:`, `chore:`, `docs:`, etc.) so GitHub's auto-generated release notes group sensibly.

## Dry Run

To rehearse a release without publishing, check the **dry_run** box when you click Run workflow. This still bumps the version and tags locally in the runner, but skips `git push`, `npm publish`, and `gh release create`. You get a summary at the end confirming what *would* have happened.

## Fixing a Bad Release

### If npm publish succeeded but the package is broken

You have 72 hours to `npm unpublish`. After that, cut a new patch release with the fix — npm strongly discourages unpublishing anything users might have installed.

```bash
# Within 72 hours of publish, worst case:
npm unpublish adzuna-sdk@X.Y.Z
```

More commonly, just ship `X.Y.Z+1` with the fix.

### If tag/release exists but publish failed

```bash
# Delete the GitHub release and tag, then re-run the workflow
gh release delete vX.Y.Z --yes
git push --delete origin vX.Y.Z
git tag -d vX.Y.Z
# Also undo the chore(release) commit on main if needed:
git revert <sha>  # or hard-reset + force-push if nothing else has merged
```

Then trigger **Run workflow** again with the same version target.

## What the Release Workflow Does Not Do

- **It does not regenerate `src/schema.ts`.** The schema is committed to the repo and regenerated manually when Adzuna updates their OpenAPI spec — not on every release. Run `bun run generate` locally, commit the change, and then release.
- **It does not run `prepublishOnly`'s generate step in a way that modifies the working tree mid-release.** The explicit workflow steps (typecheck/test/build) are deterministic and don't touch git.
- **It does not update CHANGELOG.md.** GitHub's auto-generated release notes serve as the changelog. If you want a tracked CHANGELOG file, wire in [release-please](https://github.com/googleapis/release-please) or similar.

## Installing a Released Version

Users install normally:

```bash
bun add adzuna-sdk
# or
npm install adzuna-sdk
```

Users can verify the publish was signed by GitHub Actions via the provenance badge on the [npm package page](https://www.npmjs.com/package/adzuna-sdk).

## Quick Reference

```text
Trigger:        GitHub UI → Actions → Release → Run workflow
Input:          version = patch | minor | major | X.Y.Z
                dry_run = false (true to rehearse)
Auth:           npm Trusted Publishing via GitHub OIDC (no token secret)
Produces:       chore(release) commit, vX.Y.Z tag, npm publish, GH release
Rollback:       delete tag + release, revert commit, re-run workflow
```
