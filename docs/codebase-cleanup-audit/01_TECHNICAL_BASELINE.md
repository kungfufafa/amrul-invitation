# Technical baseline

Audit date: 21 June 2026. Scope is the checked-out static invitation only; no application files were changed.

## Stack and runtime

| Area | Observed implementation |
|---|---|
| Application | Static, single-page wedding invitation (`index.html`, 3,671 lines) |
| Backend / routes / template engine | None present in this repository. Form and AJAX calls post to the current URL, so production server behavior is outside this checkout. |
| Frontend | HTML, inline CSS/JS, jQuery 3.5.1, prebuilt CSS/JS files under `public/dist/` |
| Package manager / lockfile / bundler | None present. No `package.json`, lockfile, Vite/Webpack/Rollup config, or source-to-dist build script was found. `public/dist/` must be treated as checked-in deployable output. |
| Local plugins | AOS, Slick, Selectize, modal-video, lightGallery, Flexbin; all copied into `plugin/` |
| CDN dependencies | Font Awesome, Phosphor Icons, Video.js, videojs-youtube, tsParticles, Swiper CSS, Google Fonts preloads |
| Public assets | `media/`, `plugin/`, `public/dist/`, and `src/`; mixed `./` and site-root (`/`) URLs |
| Cache busting | Ad-hoc query strings on `src/universal.js` and `public/dist/4964c82c.js`; hashed filenames in `public/dist/` but no manifest or build provenance. |
| PWA / service worker / manifest | None found. |
| CSP | No meta CSP or deployment configuration is present; server headers must be inspected before any CDN change. |

## Asset flow

```text
checked-in source / copied vendor / local media
  -> no reproducible build step in this repository
  -> index.html link/script/img/CSS-url or runtime JS injection
  -> browser request
```

The primary execution order is `jquery.js` (head, deferred), plugin CSS/JS, `universal.js`, then the two `public/dist` scripts. `public/dist/4964c82c.js` initializes AOS, lightGallery, Slick, Selectize, modal-video, Video.js, tsParticles, forms/AJAX, and language selection.

## Folder map

| Path | Purpose |
|---|---|
| `index.html` | The only page, layout, template data, inline styles, and inline configuration. |
| `media/external/` | Images, audio, web fonts, and fonts copied from external/template sources. |
| `media/template/exclusive/alsa/original/` | ALSA template ornaments, masks, frames, and backgrounds. |
| `media/icons/` | Language flags and two dress icons. |
| `plugin/` | Checked-in third-party plugin distributions. |
| `public/dist/` | Nine checked-in styles/scripts, apparently generated but without a generator or manifest. |
| `src/` | jQuery, shared browser helpers, and html2canvas. Not source in the build-tool sense. |

## Runtime baseline

The page was served unchanged from a local static server and inspected in a browser.

| Viewport | Result |
|---|---|
| Desktop 1280×720 | 20 visible sections, 44 controls, 2 forms, no horizontal overflow, no console errors. |
| Mobile 390×844 | 20 visible sections, 43 controls, no horizontal overflow. One third-party Video.js deprecation warning: `videojs.createTimeRange` will be removed in v9. |

The initial viewport did not report failed *loaded* images. This does not clear lazy-loaded assets; static reference validation found the broken assets in `03_BROKEN_AND_MISSING_ASSETS.md`.

## Functional baseline to preserve

Opening cover, music, countdown, event details/maps/calendar link, galleries/lightbox, embedded YouTube/Video.js playback, story slider, digital gift form/upload, RSVP/wishes AJAX, language switcher, desktop/mobile layouts, and the template’s animation/particle configuration are in scope for regression validation. There are no DataTables, server routes, authentication, controller/model code, or a local deployment definition in this checkout.

## Audit limitations

- The worktree already contained edits to `index.html` and `public/dist/4964c82c.js`, plus untracked monogram/flag assets. They were not altered and are treated as live workspace context, not as cleanup output.
- No production server, headers, database/configuration, backend endpoint, role-specific route, cron job, email template, or deployment configuration is available here. Findings that could be affected by those systems are deliberately not CERTAIN.
- No reproducible build exists, so build validation cannot be run. The remediation plan first establishes a deploy preview/smoke test instead.
