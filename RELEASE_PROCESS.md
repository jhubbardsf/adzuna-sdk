# Release Process for adzuna-sdk

Releases are **fully automated** via the [`Release`](.github/workflows/release.yml) GitHub Action. You trigger it from the GitHub UI, the workflow does everything else: version bump, tests, build, tag, publish to npm, and create the GitHub release.

## One-Time Setup

You only need to do these steps once, when setting up the repo.

### 1. Create the GitHub repository

Push this repo to GitHub if you haven't already:

```bash
gh repo create jhubbardsf/adzuna-sdk --public --source=. --remote=origin --push
```

### 2. Create an npm account and access token

- Sign in (or up) at [npmjs.com](https://www.npmjs.com/).
- Go to **Access Tokens → Generate New Token → Granular Access Token**.
- Scopes: **Read and write** for packages. If the `adzuna-sdk` package doesn't exist yet, also allow **Create new packages**.
- Expiration: whatever you prefer (1 year is reasonable).
- Copy the token.

### 3. Add the npm token as a repo secret

```bash
gh secret set NPM_TOKEN --body "<paste-your-npm-token>"
```

Or via the UI: **Settings → Secrets and variables → Actions → New repository secret** with name `NPM_TOKEN`.

### 4. (Optional) First-time manual publish

If the package name isn't claimed yet, npm's provenance publishing may refuse the first upload without prior ownership. The easiest fix is to publish `0.1.0` manually once:

```bash
npm login
bunx tsc
npm publish --access public
```

After that, every subsequent release goes through the workflow.

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
Requires:       NPM_TOKEN secret, repo push access via Action
Produces:       chore(release) commit, vX.Y.Z tag, npm publish, GH release
Rollback:       delete tag + release, revert commit, re-run workflow
```
