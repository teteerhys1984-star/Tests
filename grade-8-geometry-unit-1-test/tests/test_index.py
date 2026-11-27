"""Standalone indexing and deployment regression for the geometry test."""
import json
import os
import re
import sys
import tempfile
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'landing'))
import generate

class GeometryIndex(unittest.TestCase):
    def setUp(self):
        self.old_cwd = os.getcwd()
        os.chdir(ROOT)

    def tearDown(self):
        os.chdir(self.old_cwd)

    def test_metadata_and_rendered_card(self):
        meta = json.loads((ROOT / 'landing/exams.json').read_text())['overrides']['grade-8-geometry-unit-1-test']
        self.assertEqual(meta, dict(grade=8, semester=1, subject='math', title='Grade 8 Geometry Unit 1 Test', addedAt='2026-11-27'))
        with tempfile.TemporaryDirectory() as tmp:
            site = Path(tmp); exam = site / 'grade-8-geometry-unit-1-test'; exam.mkdir()
            (exam / 'index.html').write_text('<title>Grade 8 Geometry Unit 1 Test</title>')
            generate.main(['generate.py', str(site)])
            page = (site / 'index.html').read_text()
            section = re.search(r'<section class="view" id="view-exams-8-s1-math".*?</section>', page, re.S).group()
            self.assertIn('href="./grade-8-geometry-unit-1-test/"', section)
            self.assertIn('Grade 8 Geometry Unit 1 Test', section)
            self.assertIn('27-11-2026', section)
            (exam / 'index.html').write_text('<title>Rebuilt</title>')
            generate.main(['generate.py', str(site)])
            self.assertIn('27-11-2026', (site / 'index.html').read_text())

    def test_source_is_explicitly_excluded_in_both_build_paths(self):
        for filename in ('landing/scripts/build-exams.sh', '.github/workflows/deploy.yml'):
            self.assertIn('"grade-8-geometry-test-Unit 1"|', (ROOT / filename).read_text())

if __name__ == '__main__': unittest.main()
