# Remediation plan

Each phase is intentionally small. Do not combine behavioral, CDN, and asset deletion changes.

## PR-1 — Baseline and safety net

- Scope: add a static-server smoke check that records console errors, local asset 404s, desktop (1280px) and mobile (390px) screenshots, and key interactions without submitting forms.
- May change: test/CI documentation or a new test harness only.
- Must not change: `index.html`, `media/`, `plugin/`, `public/dist/`, `src/`.
- Validate: cover open, gallery/lightbox, video modal/player, slider, music button, language selector, gift/RSVP/wish form visibility; no accidental POST.
- Rollback: delete the test harness.
- Acceptance: reproducible baseline exists and root/subpath deployment behavior is known.

## PR-2 — Repair confirmed broken assets

- Scope: resolve `AST-P1-001` and `AST-P2-001` only.
- May change: the missing `Orn-64.png` source or its two references; the complete compatible lightGallery distribution.
- Must not change: DOM hierarchy, unrelated styles, application bundles, CDN URLs.
- Dependency: obtain the intended ornament and the exact lightGallery release/license decision.
- Validate: browser network has no 404 for the repaired resources; open photos/story/video lightboxes at desktop and mobile; compare screenshots.
- Rollback: restore prior single asset/distribution.
- Acceptance: no missing asset requests and visual/lightbox behavior matches baseline.

## PR-3 — Remove only validated dead files

- Scope: one group at a time: Montserrat `_1.eot` files first; then orphan WebP/icons/ornaments only with production evidence.
- May change: the named assets and any explicit references proved unused.
- Must not change: local assets with LOW confidence, the untracked monogram, business JS, or template assets not in the chosen group.
- Dependency: production request logs (including an appropriate cache window), backup/owner confirmation, and PR-1 smoke suite.
- Validate: clean static file scan, desktop/mobile smoke suite, production preview requests.
- Rollback: restore the exact files from version control/backups.
- Acceptance: only CERTAIN/HIGH candidates with documented external validation are removed.

## PR-4 — Remove unused loads and stale comments

- Scope: remove confirmed Flexbin/Swiper/tsParticles loads and stale commented tags, each in isolated commits.
- May change: corresponding `link`/`script` tags and comments only.
- Must not change: initialized plugins or their dependency order.
- Dependency: verify no injected markup/config activates the candidate feature.
- Validate: page load waterfall, visual baseline, gallery/slider/forms; test a configured particle effect before touching tsParticles.
- Rollback: restore the single tag/comment.
- Acceptance: each removed resource has zero runtime consumers and no visual/functional regression.

## PR-5 — Controlled CDN hardening/migration

- Scope: pin Phosphor and videojs-youtube to exact compatible versions; decide SRI, `crossorigin`, CSP and fallbacks for existing CDN resources.
- May change: one library URL/integrity/fallback at a time and server CSP/deployment config only with explicit authorization.
- Must not change: custom media, local business scripts, loading order, or any URL to `latest`/a range.
- Dependency: production CSP headers, verified official CDN artifact checksums, offline/intranet requirement, Video.js compatibility test.
- Validate: cold-cache and offline/fallback behavior, CSP reports, player/language/gift icon interactions, mobile/desktop screenshots.
- Rollback: revert to current exact local/CDN source.
- Acceptance: exact version, integrity when supported, compatible fallback for critical behavior, no CSP violation.

## PR-6 — Establish an asset pipeline only if needed

- Scope: document or introduce a minimal reproducible asset manifest/build only after the safety work succeeds.
- May change: new build configuration and generated outputs in a dedicated PR.
- Must not change: existing visual output or runtime behavior in the same PR.
- Dependency: owner decision on package manager and deployment target.
- Validate: byte/visual comparison of CSS/JS order, smoke suite, cache-busting behavior.
- Rollback: serve the current checked-in assets.
- Acceptance: each generated `public/dist` file can be reproduced and asset URLs are manifest-backed.

## PR-7 — Final validation and metadata review

- Scope: full asset crawl, browser smoke/visual validation, console/CSP/network validation, and separate approval for stale social canonical URLs.
- May change: documentation and approved metadata only.
- Must not change: unrelated UI/business logic.
- Validate: all local paths return 200, no console errors beyond accepted third-party warning, no unwanted external dependencies, and key interactions remain operational.
- Rollback: revert the last small PR; retain screenshots/logs as evidence.
- Acceptance: findings register is closed or explicitly deferred with owner and rationale.
