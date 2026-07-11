#!/bin/sh
# Publish the site to GitHub Pages. Run from the project root: npm run deploy
set -e

npm run build
touch dist/.nojekyll

cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "deploy $(date '+%Y-%m-%d %H:%M')"
git push -f https://github.com/harryw-developer/handoff.git gh-pages
cd ..
rm -rf dist/.git

echo "✅ published — live in a minute or two at https://harryw-developer.github.io/handoff/"
