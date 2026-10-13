# Gowtham Reddy — software engineering & applied AI

**[Explore the portfolio](https://gowthamreddy-ch.github.io/)** · [Résumé](https://gowthamreddy-ch.github.io/assets/Gowtham_Reddy_Resume.pdf) · [GitHub profile](https://github.com/gowthamreddy-ch)

Working projects in full-stack engineering, recommendation systems, and AI evaluation. Each case study explains the problem, implementation, recorded results, and limitations.

[![ReviewLens code-review dashboard](docs/assets/reviewlens/desktop-review.jpg)](https://gowthamreddy-ch.github.io/projects/reviewlens/)

## Explore the work

| Project | Focus | Evidence |
| --- | --- | --- |
| [ReviewLens](https://gowthamreddy-ch.github.io/projects/reviewlens/) | Static and AI code review with changed-line evidence and human-approved drafts. | Synthetic development comparison, false-positive analysis, and recorded results. |
| [ReelLab](https://gowthamreddy-ch.github.io/projects/reellab/) | Filmmaking studies, source-grounded craft examples, phone exercises, and live movie/series taste discovery. | Craft research checks, catalog and shuffle verification, responsive screenshots; historical MovieLens evaluation labeled separately. |
| [FindWise](https://gowthamreddy-ch.github.io/projects/findwise/) | Product discovery, explicit filters, comparison, and persistent carts. | API validation, baseline relevance results, and desktop/mobile screenshots. |
| [Evidence Lab](https://gowthamreddy-ch.github.io/projects/evidence-lab/) | Feedback analysis, incident triage, and reviewed network recovery. | Recorded synthetic evaluations and simulated-lab checks. |

These are case studies of local working prototypes. The portfolio hosts public screenshots, résumé, and evaluation evidence; the backend applications are not running on GitHub Pages.

## Application repositories

- **[Handshake Career Lab](https://github.com/gowthamreddy-ch/handshake-career-lab)** — React/TypeScript and ASP.NET Core internship workflows. [Try the browser-only demo](https://gowthamreddy-ch.github.io/handshake-career-lab/).
- **[Bloodline](https://github.com/gowthamreddy-ch/bloodline-django)** — Django donor booking and blood-bank operations, with role checks, inventory transitions, and audit history. Synthetic-data local demo.

## About this repository

This repository is the publishing copy of the portfolio. Working application source, databases, credentials, and local runtimes are not included.

GitHub Pages serves `docs/` from the `main` branch. `.nojekyll` preserves the
generated static files. Links are relative so project and account sites work.
The live backend projects require separate hosting; the public case studies
offer screenshots, evidence and a contact link for demonstrations.

## Updating

With Node.js 22 or later, create an ignored `publish-config.local.json` containing
`{"source":"absolute path to the reviewed portfolio dist directory","siteUrl":"https://gowthamreddy-ch.github.io/","statsApi":"https://gowtham-portfolio-stats.readyamber2.chatgpt.site"}`. Run:

```sh
node scripts/prepare-pages.mjs
node scripts/check-pages.mjs
```

Review `git diff` before committing. Upload only the allowlisted public assets.
Never place API keys, backend source, databases or dependency folders in `docs/`.
The HTML, CSS and browser JavaScript used to display any public website are
necessarily accessible to its visitors. No application-source download is offered.

## Live activity

The homepage loads GitHub (`gowthamreddy-ch`) and LeetCode (`gowtham1123`) statistics from [the public stats service](https://gowtham-portfolio-stats.readyamber2.chatgpt.site/health). This separate read-only service fetches LeetCode on demand. GitHub Actions refreshes `data/github.json` on a 15-minute schedule using its built-in token; the service reads that public feed to avoid shared hosting API rate limits. Scheduled runs may be delayed. No visitor login or personal access token is required. Successful results are cached for up to 15 minutes. If a platform is unavailable, the UI labels previously fetched values as a saved snapshot and retains their original timestamp.

The GitHub feed is marked as saved data if its last successful update is over 45 minutes old.

The service is deployed with Sites, project `appgprj_6aca696bfcd481919c530bcdf543024e`; its source is versioned in that Site’s source repository. It only accepts these two public profiles, and browser access is restricted to this portfolio’s origin. The static GitHub Pages site contains no credentials or server runtime.

The replacement homepage preserves all existing case study URLs and legacy homepage anchors. Light, Dark, Local time, and System appearance choices remain available; System is the default.
