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
    .*|.github|landing|_site) continue ;;
    "grade-5-math-test-U1-U2L1&2"|"grade-8-geometry-test-Unit 1"|"English Curriculum Lessons 3&4"|"English_L1L2 Test"|"grade-3-english-curriculum-exam-L1-5-A"|"grade-3-english-curriculum-exam-L1-5-B"|"grade-4-english-curriculum-exam-L1-5-A"|"grade-4-english-curriculum-exam-L1-5-B"|"grade-5-english-curriculum-exam-L1-5-A"|"grade-5-english-curriculum-exam-L1-5-B"|"grade-5-english-curriculum-exam-L1-5 (25Q) A"|"interactive-grade-8-english-exam-L1-3 A"|"interactive-grade-8-english-exam-L1-3 B"|"grade-8-science-test-model-A"|"grade-5-math-test-Unit1 21-11"|"grade-5-math-test-Unit1 21-11 Model B"|"english-foundation-test-22-11-26MI"|"English--foundation-test-22-11-26M"|"interactive-physics-Test-L1&2-model-B-24-11-26"|"grade-7-physics-test-Model-A-24-11-26"|"physics-7th-l1&l2-problems"|"grade-5-english-L1-test"|"English-Grammar-Test-L1t5a18"|"grade-8-chemistry-test-U1L3")
      echo "Skipping source folder (not a standalone exam): $name"
      continue
      ;;
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
