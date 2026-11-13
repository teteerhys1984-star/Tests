#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""اختبارات مولّد صفحة الفهرس (landing/generate.py).

تشغيل:
    python3 landing/tests/test_generate.py

تتحقق الاختبارات من:
  · الفيزياء والكيمياء لا تظهران إلا في الصفوف 7 و 8 و 9؛
  · العربية والرياضيات والإنجليزية تظهر من الصف 1 إلى 9؛
  · كل اختبار منشور يظهر تحت صفّه ومادته ورابطه كما هو;
  · الواجهة لا تستخدم قوائم منسدلة ولا أكورديون تقليدي.
"""

import os
import re
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.dirname(HERE))

import generate  # noqa: E402  (landing/generate.py)

ENGINEER = "المهندس سومر شاهين"
PHONE = "0930215022"
WHATSAPP_URL = "https://wa.me/963930215022"

PAGE = """<!doctype html><html lang="ar" dir="rtl"><head><title>%s</title></head>
<body>exam</body></html>"""


def make_site(root, exams):
    """ينشئ مجلد _site وهميًا: مجلد لكل اختبار، وفيه index.html."""
    site = os.path.join(root, "_site")
    os.makedirs(site, exist_ok=True)
    for folder, title in exams:
        os.makedirs(os.path.join(site, folder), exist_ok=True)
        with open(os.path.join(site, folder, "index.html"), "w", encoding="utf-8") as fh:
            fh.write(PAGE % title)
    return site


class Landing(unittest.TestCase):
    """أساس مشترك: يبني موقعًا وهميًا ويولّد صفحته الرئيسية."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="landing-test-")
        self.cwd = os.getcwd()
        os.chdir(ROOT)

    def tearDown(self):
        os.chdir(self.cwd)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def build(self, exams):
        site = make_site(self.tmp, exams)
        generate.main(["generate.py", site])
        with open(os.path.join(site, "index.html"), "r", encoding="utf-8") as fh:
            return fh.read()

    def subject_cards(self, page, grade):
        """المواد المعروضة في مشهد الصف (سواء كانت فيها اختبارات أم لا)."""
        view = re.search(
            r'<section class="view" id="view-grade-%d".*?</section>' % grade, page, re.S
        )
        self.assertTrue(view, "no view for grade %d" % grade)
        return re.findall(r'data-subject="([a-z]+)"', view.group(0))


class SubjectVisibility(Landing):
    def test_all_nine_grades_are_listed(self):
        page = self.build([("grade1-arabic-test", "اختبار العربية — الصف الأول")])
        for grade in range(1, 10):
            self.assertIn('id="view-grade-%d"' % grade, page)
        self.assertIn('href="#g1"', page)
        self.assertNotIn('id="view-grade-10"', page)

    def test_arabic_math_english_for_every_grade(self):
        exams = [("grade%d-math-test" % grade, "اختبار الرياضيات — الصف %s" % word)
                 for grade, word in enumerate(generate.GRADES, 1)]
        page = self.build(exams)
        for grade in range(1, 10):
            cards = self.subject_cards(page, grade)
            for subject in ("arabic", "math", "english"):
                self.assertIn(subject, cards,
                              "%s missing for grade %d" % (subject, grade))
            expected = ["arabic", "math", "english"]
            if grade >= 7:
                expected += ["physics", "chemistry"]
            self.assertEqual(cards, expected,
                             "grade %d shows unexpected subjects" % grade)

    def test_physics_and_chemistry_only_from_grade_seven(self):
        page = self.build([("grade1-anything", "اختبار الرياضيات — الصف الأول")])
        for grade in range(1, 10):
            cards = self.subject_cards(page, grade)
            for subject in ("physics", "chemistry"):
                if grade >= 7:
                    self.assertIn(subject, cards, "%s missing for grade %d" % (subject, grade))
                else:
                    self.assertNotIn(subject, cards,
                                     "%s must not appear in grade %d" % (subject, grade))
            if grade >= 7:
                self.assertEqual(cards, ["arabic", "math", "english", "physics", "chemistry"],
                                 "grade %d should show all five subjects" % grade)

    def test_no_physics_or_chemistry_links_before_grade_seven(self):
        page = self.build([("grade1-anything", "اختبار — الصف الأول")])
        for grade in range(1, 7):
            self.assertNotIn('id="view-exams-%d-physics"' % grade, page)
            self.assertNotIn('id="view-exams-%d-chemistry"' % grade, page)

    def test_exam_keeps_its_grade_subject_and_link(self):
        page = self.build([
            ("grade7-physics-exam", "اختبار الفيزياء — الصف السابع — الوحدة الأولى"),
            ("grade8-chemistry-exam", "اختبار الكيمياء — الصف الثامن"),
            ("grade5-arabic-exam", "اختبار اللغة العربية — الصف الخامس"),
        ])
        self.assertIn('id="view-exams-7-physics"', page)
        self.assertIn('href="./grade7-physics-exam/"', page)
        self.assertIn('id="view-exams-8-chemistry"', page)
        self.assertIn('href="./grade8-chemistry-exam/"', page)
        self.assertIn('id="view-exams-5-arabic"', page)
        self.assertIn('href="./grade5-arabic-exam/"', page)

    def test_no_dropdown_or_accordion(self):
        page = self.build([("grade4-adam-test", "اختبار الرياضيات — الصف الرابع")])
        for tag in ("<details", "<summary", "<select", 'role="tablist"', "accordion"):
            self.assertNotIn(tag, page)

    def test_standalone_page_without_external_resources(self):
        page = self.build([("grade4-adam-test", "اختبار الرياضيات — الصف الرابع")])
        # الرابط الخارجي الوحيد المسموح: رابط واتساب (تنقّل، لا مورد يُحمَّل)
        local = page.replace("http://www.w3.org", "").replace(WHATSAPP_URL, "")
        self.assertNotIn("http://", local)
        self.assertNotIn("https://", local)
        self.assertIn('dir="rtl"', page)
        self.assertIn('lang="ar"', page)

    def test_unclassified_exam_is_hidden_but_warned(self):
        page = self.build([("some-unknown-page", "صفحة بلا تصنيف")])
        self.assertNotIn("some-unknown-page", page)


class Presentation(Landing):
    """الأرقام الإنجليزية، بيانات المهندس، والطائرة المتحركة."""

    EXAMS = [
        ("grade4-adam-test", "اختبار الرياضيات — الصف الرابع"),
        ("grade4-adam-test-2", "اختبار الرياضيات ٢ — الصف الرابع"),
        ("grade4-math-3", "اختبار الرياضيات ۳ — الصف الرابع"),
        ("grade7-physics-exam", "اختبار الفيزياء — الصف السابع"),
        ("grade8-chemistry-exam", "اختبار الكيمياء — الصف الثامن"),
    ]

    def test_all_visible_digits_are_western(self):
        page = self.build(self.EXAMS)
        self.assertEqual(re.findall("[\u0660-\u0669\u06f0-\u06f9]", page), [])
        for grade in range(1, 10):
            self.assertRegex(page, r'class="grade-card__num"[^>]*>%d<' % grade)
        for step in (1, 2, 3):
            self.assertIn("<li><b>%d</b>" % step, page)
        self.assertIn("<span>9 صفًّا دراسيًا</span>", page)
        self.assertIn("3 اختبارات", page)            # عدد اختبارات رياضيات الصف 4
        self.assertIn("<b>5</b> اختبارًا منشورًا", page)
        self.assertRegex(page, r'class="exam-card__idx"[^>]*>3<')
        # عنوان فيه رقم عربي-هندي يُعرض بأرقام إنجليزية
        self.assertIn("اختبار الرياضيات 2 — الصف الرابع", page)
        self.assertIn("اختبار الرياضيات 3 — الصف الرابع", page)

    def test_digit_display_does_not_touch_links_or_ids(self):
        page = self.build(self.EXAMS)
        for folder, _ in self.EXAMS:
            self.assertIn('href="./%s/"' % folder, page)
        for anchor in ('href="#g4"', 'href="#g4/math"', 'id="view-grade-4"',
                       'id="view-exams-4-math"', 'id="view-exams-7-physics"'):
            self.assertIn(anchor, page)

    def test_engineer_credit_top_and_bottom(self):
        page = self.build(self.EXAMS)
        self.assertEqual(page.count(ENGINEER), 2)
        header = page[page.index("<header"):page.index("</header>")]
        footer = page[page.index("<footer"):page.index("</footer>")]
        for block in (header, footer):
            self.assertIn(ENGINEER, block)
            self.assertIn('href="%s"' % WHATSAPP_URL, block)
            self.assertIn('class="wa__num">%s<' % PHONE, block)
            self.assertIn('href="#s-whatsapp"', block)
        self.assertIn("رقم الهاتف:", footer)
        self.assertEqual(re.findall(r'href="(https?://[^"]+)"', page), [WHATSAPP_URL] * 2)
        # التذييل في نهاية الصفحة بعد المحتوى، وليس عنصرًا عائمًا
        self.assertLess(page.index("</main>"), page.index("<footer"))
        self.assertNotRegex(page, r"\.(?:foot|credit)\s*\{[^}]*position:\s*(?:fixed|sticky)")

    def test_plane_is_decorative_local_and_respects_reduced_motion(self):
        page = self.build(self.EXAMS)
        self.assertIn('<div class="sky" aria-hidden="true">', page)
        self.assertIn('id="s-plane"', page)
        self.assertRegex(page, r"\.sky \{[^}]*pointer-events: none")
        self.assertRegex(page, r"\.sky \{[^}]*z-index: 0")
        reduced = page[page.index("@media (prefers-reduced-motion: reduce)"):]
        self.assertIn(".sky *, .sky *::before, .sky *::after { animation: none !important; }",
                      reduced[:reduced.index("</style>")])
        self.assertNotIn("<img", page)
        self.assertNotRegex(page, r"<script[^>]*\bsrc=")


class RealSite(unittest.TestCase):
    """يتحقق من الموقع الحقيقي بعد بناء الاختبارات (إن وُجد مجلد _site)."""

    def test_every_published_exam_is_linked(self):
        site = os.path.join(ROOT, "_site")
        if not os.path.isdir(site):
            self.skipTest("no _site directory — run landing/scripts/build-exams.sh first")
        index = os.path.join(site, "index.html")
        if not os.path.isfile(index):
            self.skipTest("no _site/index.html — run landing/generate.py first")
        with open(index, "r", encoding="utf-8") as fh:
            page = fh.read()
        folders = sorted(
            name for name in os.listdir(site)
            if os.path.isfile(os.path.join(site, name, "index.html"))
        )
        self.assertTrue(folders, "_site has no exam folders")
        for folder in folders:
            self.assertIn('href="./%s/"' % folder, page, "%s is not linked" % folder)


if __name__ == "__main__":
    unittest.main(verbosity=2)
