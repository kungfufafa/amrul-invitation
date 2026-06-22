# Broken and missing assets

| Finding ID | Severity | Asset / area | Reference | Evidence | User impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| AST-P1-001 | P1 | `media/template/exclusive/alsa/original/Orn-64.png` | `index.html:2493,2507` | Both image references resolve to a file absent from the repository. | Two decorative image placements in the story/section area render broken when lazy-loaded. | Restore the intended source asset or replace the two references only after visual comparison. Do not substitute a nearby ornament blindly. | CERTAIN |
| AST-P2-001 | P2 | lightGallery support files: `plugin/lightgallery/dist/fonts/{lg.ttf,lg.woff,lg.svg}` and `plugin/lightgallery/dist/img/{vimeo-play.png,video-play.png,youtube-play.png,loading.gif}` | `plugin/lightgallery/dist/css/lightgallery.css:1-5,474-499,1021` | The checked-in CSS declares seven relative URLs, but neither `dist/fonts` nor `dist/img` exists. | The loaded lightbox can lack its icon font, loading indicator, or video-provider graphics when those features are used. Gallery initialization is active. | Restore the exact files matching the checked-in lightGallery CSS/JS version, or replace the whole library distribution as one tested unit. | CERTAIN |
| AST-P3-001 | P3 | `src/js/html2canvas.js.map` | `src/js/html2canvas-1.4.1.1749130377.js:10615` | A `sourceMappingURL=html2canvas.js.map` comment has no corresponding map. | Browser devtools may request a 404/source-map warning; production behavior is unaffected. | Decide whether to add the exact map for debugging or strip the comment in a future vendor-refresh PR. | CERTAIN |
| AST-P3-002 | P3 | `src/template/template.js` | `index.html:3665`, commented out | The URL is in an HTML comment and the file is absent. | No browser request or current user impact. | Treat as stale commented code, not a missing runtime asset; remove only in a reviewed dead-code PR. | CERTAIN |
| AST-P2-002 | P2 | Site-root asset URLs (`/public/dist/*`, `/src/js/*`) | `index.html:290-295,447,3644,3666,3668` | They work when deployed at the domain root (and in the audit server), but fail if the invitation is served below a path prefix. Other assets use relative URLs. | A subdirectory deployment can lose styles/scripts despite local files existing. | Confirm hosting base path before normalizing; add a preview at the intended deployment path. | HIGH |

## Runtime validation note

At initial desktop and mobile loads the browser reported no failed **already-loaded** images and no errors. The page uses `loading="lazy"`; therefore static existence checks are the authoritative proof for `AST-P1-001`. The mobile run produced one upstream Video.js deprecation warning, not an asset failure.

## Not classified as broken

- Local font files in `media/external/` resolve from the inline CSS and bundled CSS.
- `flag-id.svg` and `flag-en.svg` are dynamically referenced by the language selector; they are present.
- Particle image URLs are intentionally remote and behind `window.USING_EFFECT === 1`; the checked-in page leaves that setting false/undefined. They require production-configuration validation, not a local missing-file verdict.
