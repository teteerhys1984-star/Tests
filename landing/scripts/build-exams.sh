#!/usr/bin/env bash
# محاكاة خطوة «بناء الاختبارات» من .github/workflows/deploy.yml
# Simulation of the exam build step of the deploy workflow.
set -euo pipefail
cd "$(dirname "$0")/../.."
rm -rf _site
mkdir -p _site
found=0
for dir in */; do
  name="${dir%/}"
  case "$name" in
    .*|.github) continue ;;
  esac
  if [ ! -f "$name/package.json" ]; then
    continue
  fi
  echo "::group::Build exam: $name"
  (cd "$name" && npm ci && npm run build)
  if [ ! -f "$name/dist/index.html" ]; then
    echo "::error::$name/dist/index.html was not produced by npm run build"
    exit 1
  fi
  mkdir -p "_site/$name"
  cp "$name/dist/index.html" "_site/$name/index.html"
  echo "::endgroup::"
  found=1
done
if [ "$found" -eq 0 ]; then
  echo "::warning::No exam projects found."
fi
echo "BUILD_STEP_OK exam folders: $(ls _site | wc -l)"
