#!/bin/sh
# Regenerates previews/<theme>/index.html from previews/source/index.html. Serve the project root.
cd "$(dirname "$0")/.."
v=$(date +%s)  # cache-busting for theme.css and per-theme scripts
for t in original blueprint-papel; do
  sed -e 's#href="style.css?\(v=[0-9]*\)">#href="/previews/source/style.css?\1">\n  <link rel="stylesheet" href="theme.css?v='"$v"'">#' \
      -e "s#img-src 'self';#img-src 'self'; font-src 'self';#" -e 's#src="img/#src="/site/img/#g' -e 's#href="cv/#href="/site/cv/#g' \
      previews/source/index.html > "previews/$t/index.html"
  # Optional per-theme section, inserted before Experience. Its scripts need script-src.
  if [ -f "previews/$t/extra.html" ]; then
    awk -v f="previews/$t/extra.html" '/<section id="experience">/ { while ((getline l < f) > 0) print l } { print }' "previews/$t/index.html" |
      sed -e "s#default-src 'none';#default-src 'none'; script-src 'self';#" -e "s#\\.js\"#.js?v=$v\"#" > "previews/$t/index.tmp" && mv "previews/$t/index.tmp" "previews/$t/index.html"
  fi
done
