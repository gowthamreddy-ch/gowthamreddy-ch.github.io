# Gowtham Reddy — portfolio

Public portfolio pages, project screenshots, résumé and evaluation evidence.
The working application source, databases, credentials and local runtimes are
not included. This repository is the publishing copy of the portfolio.

GitHub Pages serves `docs/` from the `main` branch. `.nojekyll` preserves the
generated static files. Links are relative so project and account sites work.
The live backend projects require separate hosting; the public case studies
offer screenshots, evidence and a contact link for demonstrations.

## Updating

With Node.js 22 or later, create an ignored `publish-config.local.json` containing
`{"source":"absolute path to the reviewed portfolio dist directory"}`. Run:

```sh
node scripts/prepare-pages.mjs
node scripts/check-pages.mjs
```

Review `git diff` before committing. Upload only the allowlisted public assets.
Never place API keys, backend source, databases or dependency folders in `docs/`.
The HTML, CSS and browser JavaScript used to display any public website are
necessarily accessible to its visitors. No application-source download is offered.
