# tomasbazan.github.io

Personal site and CV of Tomás Bazán: https://tomasbazan.github.io

Static, single page, hand-written HTML, CSS and a small vanilla JS file
(timeline, weeks grid, theme toggle). No build step, no cookies, no trackers.
Dark mode follows the system setting, with a manual toggle.

## Layout

```
site/            what gets published
  index.html
  style.css
  app.js
  fonts/         self-hosted Instrument Sans and JetBrains Mono
  cv/            CV PDF
  img/photo.jpg  profile photo
.github/workflows/deploy.yml
.htmlvalidate.json   HTML rules
lychee.toml          link checker rules
```

## Pipeline

GitHub Actions (`.github/workflows/deploy.yml`):

1. **check** (every push and pull request)
   - `html-validate` validates the HTML against its recommended rules.
   - `lychee` checks every link: internal files (CVs, anchors, CSS) and
     external profiles.
2. **deploy** (only on `main`, only if `check` passed)
   - uploads `site/` as a Pages artifact and deploys it with
     `actions/deploy-pages`.

A broken link or invalid HTML stops the deploy.

## Run locally

```sh
python3 -m http.server -d site 8000      # http://localhost:8000
npx html-validate site/                   # HTML check
lychee --config lychee.toml 'site/**/*.html'   # link check
```

## TODO

- Homelab live status on the site (services up/down). Needs a polished, safe
  design first: no endpoint exposing the home network directly; e.g. a status
  JSON published periodically from the homelab, read by the page.
