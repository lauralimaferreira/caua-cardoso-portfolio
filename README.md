# Cauã Cardoso — Pre-Med Portfolio (Version 2, review build)

A responsive pre-med portfolio based on the supplied desktop visual reference. The content is grounded in the **Caua Cardoso** planning document reviewed on November 16, 2026. The website uses vanilla JavaScript, HTML and CSS, with no runtime dependencies. All pages are written in English.

**Status: Local review only. No GitHub, Vercel, or Railway deployment was made.**

## Changes from v1

- Corrected the misleading profile label to **School Year — 2026–2027 · Junior**. This is the current academic year, **not a confirmed graduation date**.
- Replaced the low-resolution research-banner crop with a new high-resolution original image, and the lab/stethoscope thumbnail crops with scalable SVG illustrations.
- Replaced the cropped DNA logo with a vector asset. The portrait is still a crop from the supplied reference and is explicitly marked **pending approval** inside the preview. A separately approved, higher-resolution portrait is needed for release.
- Removed draft article bodies from the JavaScript bundle and all article links. The Blog only shows topics labeled **In preparation**; old `/blog/<slug>` draft URLs now render the site's 404 page.
- Removed the simulated contact form. With no approved email address, the Contact page explicitly states that no messages can be sent or stored. Once Cauã approves a public address, set `profile.email` in `src/data.js`; the Contact page then shows a `mailto:` link.
- Added temporary `noindex, nofollow` metadata and `robots.txt` blocking indexing during review; **remove these restrictions when explicitly approved for public release**.
- Improved the Node server so missing `.js`, `.css`, and image assets return a real HTTP 404 instead of the home page.
- Expanded tests to include content assertions, image-asset integrity, privacy/review gates, production HTTP routes, and cross-viewport browser rendering.

## Pages

Home, About Me, Research, Academics, Leadership, Service, Blog, Resume, Extracurriculars and Contact.

Completed/recorded activities remain distinct from **Exploring** competitions; there is no claim that proposed awards, registrations, or unfinished research are already achieved.

## Run locally

Node.js 20 or newer.

```bash
npm run dev
# open http://localhost:3000
```

To test and build the production files:

```bash
npm test       # builds first and runs all nine Node tests
npm start      # serves the dist/ build with SPA route fallback
```

The optional offline browser-rendering test uses Playwright for Python and a local Chromium installation (or the Playwright-installed Chromium):

```bash
pip install playwright
python -m playwright install chromium
npm run build
npm run test:browser:offline
```

This offline browser test runs all ten routes at 1600, 390 and 320 pixels, checks for horizontal overflow and failed images, and checks the key CTA, mobile menu, unpublished blog pages, and contact status. It uses an in-memory document and simulated route/history updates because this authoring environment blocks local HTTP navigation in the browser. HTTP loading of real production routes is tested independently by the Node suite.

For a full HTTP-driven Chromium smoke test, run `npm run test:browser:live` in an environment that allows a browser to access localhost. That script remains available but was **not** successfully run in this authoring environment due to `net::ERR_BLOCKED_BY_ADMINISTRATOR`.

## Before approving publication

1. Replace `public/assets/portrait-reference.webp` with a licensed/approved portrait of Cauã in sufficient resolution. Change the reference in `src/main.js`, remove the `figcaption` review badge, and confirm the appearance at mobile and desktop sizes.
2. Approve the public contact email; add it to `profile.email` in `src/data.js`, or keep the Contact page disabled if no public address is desired.
3. Approve exactly which blog articles will be public. Currently, **no draft article bodies ship**. Add approved articles back individually, with links, after reviewing the final text.
4. Confirm that academic, extracurricular, service and research information may be published; confirm current status as of the publication date.
5. With explicit launch approval, remove `<meta name="robots" content="noindex, nofollow" />` from `index.html` and change the build script's `robots.txt` to `Allow: /`. **These flags are a courtesy to indexing robots, not access controls; do not deploy private material.**
6. Run the tests, inspect the live Vercel site on mobile and desktop, and check image loading and direct links.

## GitHub and Vercel (after approval)

Create a new repository specifically for this project. Do not mix it with Admit Bloom or IMO Resource Hub. Upload the source files of this project folder; leave out ignored `dist/`, `.env`, and `previews/`.

Import into Vercel with framework preset **Other**, build command `npm run build`, and output directory `dist`. A `vercel.json` is included for client-side routing.

## Railway (optional, after approval)

The site does not need a database or backend for its current features. Vercel alone can host the frontend. If Railway is needed, create a separate project/service, link the same repository, set the build command to `npm run build` and start command to `npm start`, and configure a domain. The server reads Railway's `PORT` environment variable.

## Edit map

- `src/data.js`: approved profile, research, activities, opportunities and upcoming blog topics.
- `src/main.js`: routing, navigation, all page templates and interactions.
- `src/styles.css`: design, typography and responsive breakpoints.
- `public/assets/`: images and vector art. `portrait-reference.webp`, decorative microscope and decorative heart are still placeholders cropped from the supplied reference.
- `tests/site.test.mjs`: automated source and production HTTP checks.
- `tests/browser_offline_smoke.py`: offline browser rendering and interactions.
- `tests/browser_smoke.py`: optional real HTTP/browser tests for unrestricted environments.
- `previews/`: rendered review screenshots (not committed by default).

No changes were made to the v1 archive or any connected remote deployment service.
