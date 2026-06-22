# Unused and duplicate findings

No deletion is performed by this audit. “HIGH” means a candidate for a narrowly scoped, manually validated removal PR; it does not mean safe to delete in this dirty workspace.

| Finding ID | Category | Severity | Candidate | Evidence | Removal risk | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| DEAD-P3-001 | UNUSED_ASSET | P3 | `media/external/dW1ibmFpbC90aHVtYi1sZy04OTA5MDMtODAwLTgwMC0xNzc3Mjc3Njg2LTA4MTBkNTgyMWViMzZlNTRkYTAyODM1NC5wbmc.webp` (174 KiB) | No references in HTML, CSS, JS, config, or comments. | A missing external system is theoretically possible, but none exists in this repository. | Include in a candidate-removal PR only after production request-log/backup confirmation. | HIGH |
| DEAD-P3-002 | UNUSED_ASSET | P3 | `media/icons/ic-dress-man-formal.png`, `media/icons/ic-dress-woman-formal.png` (2.7 KiB) | No static or dynamic reference in available code. | Could belong to an omitted server-side template. | Validate deployed requests, then remove together if unused. | HIGH |
| DEAD-P3-003 | UNUSED_ASSET | P3 | `Orn-49.png`, `Orn-66.png` (230 KiB total) | No repository reference. Other ALSA ornaments are directly referenced or exposed through a CSS variable. | Template variants could be selected outside this static checkout. | Keep until production/template-owner confirms this page has no variant configuration. | HIGH |
| DEAD-P3-004 | UNUSED_ASSET / DUPLICATE_ASSET | P3 | `montserrat-{300,400,500,700,800}_1.eot` (72 KiB) | Each is byte-identical to its non-suffixed counterpart; all CSS references use the non-suffixed name. | Very low in this repository; legacy IE paths still need the non-suffixed files. | Best first removal candidate after a production request-log check. | HIGH |
| DEAD-P3-005 | UNUSED_ASSET / DUPLICATE_ASSET | P3 | `ha-monogram-antique-gold-transparent.png` (842 KiB) | Byte-identical to `ha-monogram-antique-gold.png` and unreferenced. It is untracked in the existing worktree. | High ownership risk: it may be an intentional user addition awaiting use. | Do not remove without explicit owner confirmation. | LOW |
| DEAD-P3-006 | DEAD_CODE | P3 | `plugin/flexbin/flexbin.css` (1.9 KiB) | Linked from `index.html:276`; no `.flexbin` markup or JS hook exists. Only dormant CSS selectors mention it. | A future template injection could add it. | Remove only after a page/production DOM scan confirms no Flexbin markup. | HIGH |
| DEAD-P3-007 | UNUSED_DEPENDENCY | P3 | Swiper 11 CDN stylesheet | `index.html:445` loads it, but no Swiper script, container, slide markup, or class hook exists. | Runtime HTML could theoretically be injected, although none is present. | Validate with a network/DOM capture, then remove the one stylesheet link. | HIGH |
| DEAD-P2-001 | UNUSED_DEPENDENCY | P2 | tsParticles 3.9.1 CDN bundle | Always loaded at `index.html:3633`, but initialization returns unless `window.USING_EFFECT === 1`; this page does not define it. | Production configuration could inject `USING_EFFECT`; removing prematurely would disable effects. | First measure production configuration/use. If disabled, remove in a dedicated PR. | HIGH |
| DEAD-P3-008 | STALE_BUILD_ARTIFACT | P3 | commented vendor/template tags | `index.html:3631-3632,3665` | Historical tsParticles and missing template script tags are inert. | None at runtime. | Remove with other commented dead code after confirming history is not intentionally retained inline. | CERTAIN |

## Duplicate-hash evidence

| SHA-256 group | Files |
|---|---|
| `092850…a066` | `montserrat-700.eot`, `montserrat-700_1.eot` |
| `1fa121…5a0d` | `montserrat-400.eot`, `montserrat-400_1.eot` |
| `35d592…f2ba` | `montserrat-800.eot`, `montserrat-800_1.eot` |
| `ba3d6e…618f` | `montserrat-500.eot`, `montserrat-500_1.eot` |
| `d82582…f8557` | `montserrat-300.eot`, `montserrat-300_1.eot` |
| `30f962…3432` | `ha-monogram-antique-gold.png`, `ha-monogram-antique-gold-transparent.png` |

## Retained deliberately

The similarly named `_1.webp` portrait/gallery images are **not** identical by hash and are referenced separately, so they are not duplicate candidates. All custom fonts are referenced through CSS. AOS, Slick, Selectize, modal-video, lightGallery, Video.js, html2canvas, and the two application bundles have direct runtime calls and remain out of scope for removal.
