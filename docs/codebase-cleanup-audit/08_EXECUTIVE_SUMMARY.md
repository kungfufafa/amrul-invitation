# Executive summary

## Verdict

**Cleanup is not ready for bulk deletion or CDN migration.** It is ready for a safety-net PR and two targeted asset repairs. The repository is a static single-page invitation with 191 local assets (33.01 MiB), no package manager, no build configuration, no asset manifest, and no deployment/CSP configuration.

| Measure | Count / status |
|---|---|
| Local assets inventoried | 191 |
| Confirmed broken/missing asset findings | 2 groups (1 missing ornament; 7 lightGallery companion files) |
| Source-map/stale commented references | 2 |
| High-confidence unused/duplicate candidates | 7 candidate groups (including 5 exact EOT duplicates) |
| CDN/library hardening candidates | 4 immediate concerns: unpinned Phosphor, unpinned videojs-youtube, unverified SRI/CSP, likely unused Swiper CSS |
| Libraries that should remain local now | jQuery, AOS, Slick, Selectize, modal-video, lightGallery, html2canvas, custom/template media, fonts, music |

## Biggest risks

1. `Orn-64.png` is definitively missing and affects live page decoration.
2. The lightGallery copy is incomplete; its CSS references seven absent resources, and it has a beta/GPLv3 banner that requires provenance/license review before replacement.
3. CDN resources are not uniformly exact-pinned or protected with SRI/fallbacks, while CSP/deployment headers are unknown.
4. The source tree is not reproducibly built. Hashed `public/dist` files cannot be regenerated from this checkout.
5. The worktree already includes user edits/untracked assets. Automated cleanup would risk deleting active in-progress work.

## Quick wins, in order

1. Add a non-submitting smoke/visual/network baseline.
2. Restore the intended `Orn-64.png` and lightGallery companion files.
3. After production evidence, remove the five byte-identical unreferenced Montserrat EOT copies (72 KiB).
4. Validate and remove the unused Swiper CSS/Flexbin CSS; measure tsParticles before considering it.
5. Pin the two bare unpkg package URLs and decide CSP/SRI/fallback policy in a dedicated CDN PR.

## Unsafe areas to touch without extra evidence

AJAX/form code, the two `public/dist` scripts, all custom fonts/media, language assets, Video.js integration, current CDN order, root-relative asset paths, optional tsParticles configuration, and every LOW-confidence/untracked candidate. These can affect legacy templates, production configuration, uploads, or existing in-progress user work.

The recommended implementation sequence is exactly the seven PR phases in `07_REMEDIATION_PLAN.md`. This audit made no application, asset, dependency, lockfile, or configuration change; it created only the requested documentation.
