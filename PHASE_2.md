# Phase 2 V2 — Dashboard, Home, profile and biography

Base: Phase 1 V2 / commit 258ab6e4498226af74e585c50344da82297a67f5. This patch is local only. Extract the NEW_CHANGED ZIP at the repository root. No files need deleting.

## Delivered

- Single-user manager reuses Phase 1 authentication, sessions and logout. Overview, Home & Goals, My Profile, and About Me forms. Responsive sidebar and mobile layout. Changes across tabs are retained, explicit confirmation before saving, discard/reload protection, clear error messages and conflicting-revision handling. No private data is stored in browser local storage.
- Editable fields: three hero headlines, introduction, personal quote, one to four goals, display name and full name, school, school year, grade, public city/state, intended field, interests, approved optional public email, About introduction and story title, biography paragraphs, and values. The first three interests appear on Home. Academics, resume and contact use the edited profile where relevant. The portrait remains the provisional image.
- One PostgreSQL singleton profile row seeded from the baseline, migration 003 applied under existing migration lock. Parameterized updates use an atomic revision comparison. Public GET returns only the approved schema and revision. Authenticated GET/POST at `/api/admin/profile` use existing session checks; write requires exact Origin and JSON. No secrets or private admin data in the frontend. Input is plain text, validated and escaped in rendering.
- Without deployment configuration, the frontend shows the existing baseline. With `PORTFOLIO_BACKEND_ORIGIN` (Vercel) and `PUBLIC_SITE_ORIGIN` (Railway), it loads saved data and adds a footer admin link. A configured API read starts with a loading screen; on failure, it displays an unavailable screen with retry and an admin link, never stale baseline data. No need to redeploy for every content edit once connected.

## Design decisions / boundaries

Save changes is a confirmed live save, not a private draft. Phase 6 adds draft, preview, explicit publication and recovery. Phase 5 adds photos/documents; awards and other sections remain later phases. All profile fields are intended for public display; require student/guardian approval for publication, especially name, school and contact details. Use only a public email approved for this site. The design, navigation and noindex settings are retained; some academic fields are now generated from the same profile rather than duplicated static text. Public data fetch is on page load; refresh the page to see a newly saved change. The unconfigured portfolio retains its original content. Once configured, it deliberately does not fall back to old personal details or store a persistent browser cache. Availability therefore depends on the backend; visitors can retry. Static metadata is generic to avoid outdated names in previews; the browser title uses the loaded profile. Authenticated manager branding, contact and public profile labels follow the edited display name. User-written biography, quote and introduction are not automatically rewritten. The profile schema and baseline exist in both source roots because Railway builds from `/backend`; tests enforce parity.

## Deployment gate

No Railway service or PostgreSQL database has been created. No production password selected, no GitHub or Vercel write. Follow backend/README.md for separate credentials and variables, validate Phase 1 ingress/rate-limit assumptions, real `npm ci`, Docker build, PostgreSQL migrations and persistence, HTTPS login, public CORS and actual Vercel build before enabling production. Verify the noindex setting is retained during review. Rollback of the frontend can be done via Vercel; preserve the database row and do not run destructive migrations to roll back. The integration suite has been extended; a real PostgreSQL runtime remains unverified here.

## V2 regression coverage

- Hero and cards expand vertically; long headlines use reduced typography, text wraps, and grid/flex children can shrink. The mid-size desktop card stacks internally to avoid cramped columns.
- 180 adversarial layout checks: three content scenarios (baseline, audit examples, maximum-length unbroken text), twelve widths from 320 to 1600 px and five editable public pages. Tests inspect element geometry and internal overflow, not just document width.
- Mocked public API tests include failure and retry recovery, changed name in contact, header, footer, signature and title; admin browser tests include renamed account display.

## Local verification results

- Root Node suite: 11/11 passed. Backend Node suite: 25/25 passed (18 authentication checks and 7 profile checks, using an in-memory store for HTTP tests).
- Static browser suite: 30/30 page-size checks passed, plus mobile navigation and unpublished-blog regressions. Dashboard mocked API browser suite passed at 1440, 390 and 320 px widths. Public profile mocked API browser test passed (including text escaping, updated fields, contact, admin link and offline fallback).
- Build-time public origin generation checked. No public secret values configured.
- Live browser HTTP test failed at navigation due to `ERR_BLOCKED_BY_ADMINISTRATOR`; PostgreSQL test skipped because `TEST_DATABASE_URL` was unavailable. No Docker build, actual dependency install or production deployment executed. Do not classify these as passed.
