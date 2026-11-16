# V2 change report — 2026-11-16

| Audit item | Resolution | Status |
| --- | --- | --- |
| Class-year label showed `2026 (Junior)` | Changed to `School Year · 2026–2027 · Junior` using the canonical profile value | Corrected |
| Portrait cropped from reference | Clearly identified in the UI and README. Original photo not available. | **Pending an approved photo** |
| Contact form had no email delivery | Removed the form; no messages can be entered, sent or stored. A verified public `mailto:` link becomes available only after `profile.email` is filled. | Safely disabled |
| Draft blog articles could be accessed | Removed unpublished body text from shipped JS; kept unlinked topic previews. | Corrected |
| Other image crops too small | New high-res research art and scalable lab/stethoscope previews, vector DNA logo. | Corrected; decorative corner crops remain review assets |
| Tests too limited | 9 automated Node tests and 30 offline browser page-size checks, plus interaction and content checks. | Expanded |
| Missing static resources returned the homepage | Returns correct HTTP 404 for absent assets. | Corrected |
| Launch review safeguards | Added temporary `noindex` and `robots.txt` block. | Pending explicit approval to remove |

**Test results:** `npm test`: 9/9 pass. `npm run test:browser:offline`: 30/30 route/viewport checks pass, plus interactive assertions. The full local-HTTP browser script cannot run in this restricted environment; it is included for use in an unrestricted environment. All changes were made locally; no GitHub, Vercel or Railway modification or deployment occurred.
