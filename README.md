# Pathways To Economic Mobility

A minimal [SvelteKit](https://kit.svelte.dev/) + Svelte 5 template for embeds and stories. Output is static HTML (`adapter-static`) so you can host it anywhere or drop a generated snippet into WordPress (or another CMS) via a CDN.

## First run (after clone)

```bash
npm install
npm run setup
```

`setup` asks for an npm-safe package name, page title, meta description, and GitHub org/repo so it can fill `package.json`, `src/lib/config/project.config.js` (title, description, jsDelivr `cdnBaseUrl`), and this README heading. Re-run only if you still see `YOUR_*` / `your-story-slug` tokens.

`npm install` runs the `prepare` script (`svelte-kit sync`), which is fine with the placeholder `package.json` name until you personalize it with `setup`.

## Quick start

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Configuration

Edit `src/lib/config/project.config.js` (import it elsewhere as `import project from '$lib/config/project.js'`).

| Area | Purpose |
|------|---------|
| **meta** | Page `title` and `description` in the root layout. |
| **document** | `mode: 'standalone'` loads viewport meta and Google Fonts from the layout; `'inline'` skips those fonts when the host page already defines typography. Toggle `includeViewportMeta` / `includeGoogleFonts` as needed. |
| **layout** | `mode: 'column'` applies `maxWidthPx` with content aligned to the start (not centered). `mode: 'full'` is full-bleed width on the app root. `horizontalPadding` is a CSS length on that root (use `'0'` for flush edges). |
| **build** | `cdnBaseUrl` (your published `dist/` URL) and `embedContainerId` used when generating the WordPress embed file. |

## Publish

One command builds, generates the WordPress embed, syncs GitHub Pages, and pushes to GitHub (which updates jsDelivr and Pages):

```bash
npm run publish
```

This will:

1. Build into `dist/`
2. Write `wordpress-embed.html` (validated against `dist/`)
3. Copy `dist/` → `docs/` for GitHub Pages (adds `.nojekyll`)
4. Commit `dist/`, `docs/`, and `wordpress-embed.html`
5. Push to `origin`
6. Purge stable jsDelivr paths (video, images, fonts, `embed-bootstrap.js`, etc.) so `@main` serves the latest files immediately

Flags:

- `npm run publish -- --no-push` — build, sync, and commit locally without pushing
- `npm run publish -- --no-git` — build and sync only; skip commit/push
- `npm run publish -- --no-purge` — skip the jsDelivr cache purge after push

After publishing, paste `wordpress-embed.html` into WordPress if the asset hashes changed. jsDelivr reads `dist/` from GitHub (`build.cdnBaseUrl` in `project.config.js`). GitHub Pages serves `docs/`. Hashed bundles under `_app/immutable/` get new filenames each build; purge targets stable paths like media and `embed-bootstrap.js`.

## WordPress embed

For local embed generation without publishing:

```bash
npm run build:embed
```

`tasks/generate-embed.js` uses `build.cdnBaseUrl` from `project.config.js` and verifies every asset referenced in the embed exists under `dist/` before writing `wordpress-embed.html`.

In WordPress, add a Custom HTML block and paste the contents of `wordpress-embed.html`.

### Forks, templates, and publish

If you clone this repo, use it as a GitHub template, or fork it for a new story, run **`npm run setup`** before you publish (or hand-edit the same `YOUR_*` tokens in `src/lib/config/project.config.js`). Otherwise `cdnBaseUrl` will still point at placeholder org/repo paths and the generated `wordpress-embed.html` will load the wrong assets.

## Scripts

- `npm run setup` — Post-clone prompts; fills template tokens in `package.json`, `project.config.js` (title, description, CDN URL), README
- `npm run dev` — Vite dev server
- `npm run build` — Production build into `dist/`
- `npm run build:embed` — `build` then `node tasks/generate-embed.js`
- `npm run publish` — build, embed, sync `docs/`, commit, and push
- `npm run preview` — Local preview of the production build

## Project layout (source)

- `src/routes/` — `+layout.svelte` (head, layout root, theme), `+page.svelte` (home)
- `src/lib/components/` — Scroller, slides, index shell, background stub
- `src/lib/config/` — `project.config.js` and thin `project.js` re-export
- `src/lib/data/copy.json` — Slide copy (`id` + `text`)
- `tasks/setup.js` — Clone-time slug / title / GitHub URL wiring
- `tasks/generate-embed.js` — Embeds script for CMS injection
- `tasks/publish.js` — Build, embed, GitHub Pages sync, push, and jsDelivr purge
- `tasks/purge-jsdelivr.js` — Purge stable `dist/` paths on jsDelivr after publish
