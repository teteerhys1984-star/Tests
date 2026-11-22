"""Run from repository root after the platform build. No network."""
from pathlib import Path
import json
import re
root = Path(__file__).resolve().parents[2]
exam = 'grade-4-english-foundation-test-22-11-26m'
page = (root / '_site/index.html').read_text()
section = re.search(r'<section class="view" id="view-exams-4-s1-english".*?</section>', page, re.S)
assert section and f'href="./{exam}/"' in section.group(), 'wrong grade/semester/subject or URL'
assert page.count(f'href="./{exam}/"') == 1
assert 'English--foundation-test-22-11-26M/' not in page
built = (root / '_site' / exam / 'index.html').read_text()
assert '<title>English--foundation-test-22-11-26M</title>' in built
assert not re.search(r'<(?:script|link)[^>]+(?:src|href)=', built), 'external script or stylesheet'
assert 'fonts.googleapis' not in built
assert exam in built
assert (root / '_site' / exam / 'index.html').read_bytes() == (root / exam / 'dist/index.html').read_bytes()
config = json.loads((root/'landing/exams.json').read_text())['overrides'][exam]
assert config == {'grade':4,'subject':'english','semester':1,'title':'English--foundation-test-22-11-26M'}
print('FOUNDATION_SITE_OK: unique grade 4 / semester 1 / English link; self-contained bundle; exact deployment copy')
