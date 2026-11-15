# Portfolio bug audit — November 15, 2026

## Fixed

- Invalid dates or malformed warning fields in browser storage could throw before either profile requested fresh data. Validate saved and network payloads before rendering and ignore invalid cache entries.
- An older cached response could replace a newer saved snapshot. Select the newest valid saved source and reject older network responses.
- Browser HTTP caching could add another delay to the service cache. Fetch statistics with `cache: no-store`; retain the service's deliberate 15-minute cache and rate-limit handling.
- Old service data could appear connected. Mark data older than 45 minutes as a saved snapshot and retain the actual fetch timestamp. Retry both profiles when connectivity returns.
- Re-rendering an empty calendar left stale month labels and daily rows. Clear them before handling the empty state.
- History traversal could leave project selection and pinned skills inconsistent with URL parameters. Restore both on `popstate`.
- The release link checker skipped same-page anchors. It now checks these and uses a path-separator boundary for containment.

## Stats service

The configured GitHub Actions schedule runs every 15 minutes, but observed successful runs on November 15 were hours apart. A reachable but stale scheduled feed previously prevented the worker from trying live GitHub data.

The existing public Sites worker now falls back to the live public profile when the feed is older than 45 minutes. Existing caching, request coalescing, and rate-limit backoff bound requests. If live data fails, it preserves the feed and its original timestamp. Missing optional calendars remain explicitly unavailable. No access tokens are sent to visitors.

Deployed worker source: `489fa90c29b7cc72184f327662c037315ada30a2`, Sites version 4. Canonical service origin: https://gowtham-portfolio-stats.gowthamreddych.chatgpt.site. Real GitHub and LeetCode responses returned HTTP 200 with fresh timestamps at approximately 23:03 UTC after deployment. The prior alias still responded but initially returned a stale fallback; the portfolio now uses the current canonical origin.

## Reproducible validation

Serve `docs` on loopback port 4199, then run:

```text
node scripts/check-pages.mjs
playwright-cli -s=portfolio-bugs open http://127.0.0.1:4199/
playwright-cli -s=portfolio-bugs run-code --filename=scripts/verify-portfolio-browser.js
playwright-cli -s=portfolio-bugs run-code --filename=scripts/audit-portfolio-pages.js
```

The regression script uses mocked profile responses in an isolated browser context; it does not measure upstream availability. It covers invalid caches, malformed/older responses, offline/reconnect, blocked storage, four viewport widths, project/skill history, keyboard tabs, mobile menu focus, and reduced motion. Calendar-data and rate-limit behavior are additionally covered by the existing eight-test stats suite and four new worker tests. The worker builds and its exported handler validates as ESM.

Ten portfolio pages passed checks at 320, 390 and 1440 pixels for overflow, broken images, duplicate IDs and uncaught page errors. The checker validated 188 local references, including fragments. This is a targeted regression audit, not an exhaustive accessibility or security certification.

## Release security and limitations

Available portfolio and worker Git histories were scanned for common credential/private-key patterns and environment files: 294 and 12 unique historical blobs respectively, no matches. Public artifacts also passed secret-pattern and localhost-link checks. Pattern scans cannot establish the absence of every possible secret.

The worker rejects foreign browser origins, non-owner profile selectors and write methods; automated tests cover these boundaries. Its responses specify JSON, `nosniff`, and restricted CORS. The static portfolio has no private accounts, database, uploads, payments or admin operations, so those baseline controls are inapplicable. GitHub Pages controls HTTP response headers; this work does not claim configurable server-level headers there.

External platforms and GitHub scheduling remain outside the portfolio's control. Refresh checks the service, whose normal cache lasts up to 15 minutes. Rate limits or outages can still produce clearly labeled saved data. Tests ran in Chromium; other browser engines and assistive technologies were not exhaustively tested.
