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

import json
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

    def semester_cards(self, page, grade):
        """بطاقات الفصل الدراسي داخل مشهد الصف."""
        view = re.search(
            r'<section class="view" id="view-grade-%d".*?</section>' % grade, page, re.S
        )
        self.assertTrue(view, "no view for grade %d" % grade)
        return re.findall(r'data-semester="(s[12])"', view.group(0))

    def subject_cards(self, page, grade, semester="s1"):
        """المواد المعروضة في مشهد الفصل (سواء كانت فيها اختبارات أم لا)."""
        view = re.search(
            r'<section class="view" id="view-sem-%d-%s".*?</section>'
            % (grade, semester), page, re.S
        )
        self.assertTrue(view, "no semester view %s for grade %d" % (semester, grade))
        return re.findall(r'data-subject="([a-z]+)"', view.group(0))

    def exam_cards(self, page, grade, semester="s1", subject="arabic"):
        view = re.search(
            r'<section class="view" id="view-exams-%d-%s-%s".*?</section>'
            % (grade, semester, subject), page, re.S
        )
        if not view:
            return []
        return re.findall(r'href="\./([^"/]+)/"', view.group(0))


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
            for semester in ("s1", "s2"):
                self.assertNotIn('id="view-exams-%d-%s-physics"' % (grade, semester), page)
                self.assertNotIn('id="view-exams-%d-%s-chemistry"' % (grade, semester), page)

    def test_missing_semester_views_for_surrounding_grades(self):
        page = self.build([("grade4-adam-test", "اختبار الرياضيات — الصف الرابع")])
        self.assertIn('id="view-sem-9-s2"', page)      # مشهد فصل بلا اختبارات
        self.assertNotIn('id="view-exams-9-s2-math"', page)

    def test_exam_keeps_its_grade_subject_and_link(self):
        page = self.build([
            ("grade7-physics-exam", "اختبار الفيزياء — الصف السابع — الوحدة الأولى"),
            ("grade8-chemistry-exam", "اختبار الكيمياء — الصف الثامن"),
            ("grade5-arabic-exam", "اختبار اللغة العربية — الصف الخامس"),
        ])
        self.assertIn('id="view-exams-7-s1-physics"', page)
        self.assertIn('href="./grade7-physics-exam/"', page)
        self.assertIn('id="view-exams-8-s1-chemistry"', page)
        self.assertIn('href="./grade8-chemistry-exam/"', page)
        self.assertIn('id="view-exams-5-s1-arabic"', page)
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
        for step in (1, 2, 3, 4):
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
        for anchor in ('href="#g4"', 'href="#g4/s1"', 'href="#g4/s1/math"',
                       'id="view-grade-4"', 'id="view-sem-4-s1"',
                       'id="view-exams-4-s1-math"', 'id="view-exams-7-s1-physics"'):
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


class Grade5EnglishExamIndex(Landing):
    """اختبار اللغة الإنجليزية للصف الخامس — المسار: الصف الخامس ← الفصل الأول ← الإنجليزية."""

    FOLDER = "grade5-english-curriculum-exam-l1-5-a"
    TITLE = "Grade 5 English Curriculum Exam L1-5 A"

    def test_card_appears_under_grade_five_first_semester_english(self):
        page = self.build([(self.FOLDER, self.TITLE)])
        self.assertIn('id="view-exams-5-s1-english"', page)
        self.assertEqual(
            self.exam_cards(page, 5, "s1", "english"),
            [self.FOLDER],
        )

    def test_card_does_not_appear_in_another_grade_or_semester(self):
        page = self.build([(self.FOLDER, self.TITLE)])
        for grade in range(1, 10):
            if grade == 5:
                continue
            self.assertNotIn(self.FOLDER, self.exam_cards(page, grade, "s1", "english"))
        self.assertNotIn(self.FOLDER, self.exam_cards(page, 5, "s2", "english"))

    def test_card_uses_the_published_title_and_folder_link(self):
        page = self.build([(self.FOLDER, self.TITLE)])
        self.assertIn('href="./%s/"' % self.FOLDER, page)
        self.assertIn(self.TITLE, page)
        self.assertEqual(page.count('href="./%s/"' % self.FOLDER), 1)

    def test_card_is_placed_by_the_repository_override(self):
        """التصنيف يأتي من landing/exams.json (الصف الخامس / إنجليزي / الفصل الأول)."""
        with open(os.path.join(ROOT, "landing", "exams.json"), "r", encoding="utf-8") as fh:
            overrides = json.load(fh)["overrides"]
        self.assertIn(self.FOLDER, overrides)
        entry = overrides[self.FOLDER]
        self.assertEqual(entry["grade"], 5)
        self.assertEqual(entry["subject"], "english")
        self.assertEqual(entry["semester"], 1)
        self.assertEqual(entry["title"], self.TITLE)


class Grade5EnglishExam25QIndex(Landing):
    """اختبار اللغة الإنجليزية للصف الخامس L1-5 (25Q) A — المسار: الصف الخامس ← الفصل الأول ← الإنجليزية."""

    FOLDER = "grade5-english-curriculum-exam-l1-5-25q-a"
    TITLE = "Grade 5 English Curriculum Exam L1-5 (25Q) A"

    def test_card_appears_under_grade_five_first_semester_english(self):
        page = self.build([(self.FOLDER, self.TITLE)])
        self.assertIn('id="view-exams-5-s1-english"', page)
        self.assertEqual(
            self.exam_cards(page, 5, "s1", "english"),
            [self.FOLDER],
        )

    def test_card_does_not_appear_in_another_grade_or_semester(self):
        page = self.build([(self.FOLDER, self.TITLE)])
        for grade in range(1, 10):
            if grade == 5:
                continue
            self.assertNotIn(self.FOLDER, self.exam_cards(page, grade, "s1", "english"))
        self.assertNotIn(self.FOLDER, self.exam_cards(page, 5, "s2", "english"))

    def test_card_uses_the_published_title_and_folder_link(self):
        page = self.build([(self.FOLDER, self.TITLE)])
        self.assertIn('href="./%s/"' % self.FOLDER, page)
        self.assertIn(self.TITLE, page)
        self.assertEqual(page.count('href="./%s/"' % self.FOLDER), 1)

    def test_card_is_placed_by_the_repository_override(self):
        """التصنيف يأتي من landing/exams.json (الصف الخامس / إنجليزي / الفصل الأول)."""
        with open(os.path.join(ROOT, "landing", "exams.json"), "r", encoding="utf-8") as fh:
            overrides = json.load(fh)["overrides"]
        self.assertIn(self.FOLDER, overrides)
        entry = overrides[self.FOLDER]
        self.assertEqual(entry["grade"], 5)
        self.assertEqual(entry["subject"], "english")
        self.assertEqual(entry["semester"], 1)
        self.assertEqual(entry["title"], self.TITLE)


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

    def test_source_upload_folder_is_not_published_as_an_exam(self):
        """مجلد المصدر لا يظهر كرابط اختبار — يُنشر المجلد النهائي فقط."""
        site = os.path.join(ROOT, "_site")
        index = os.path.join(site, "index.html")
        if not os.path.isfile(index):
            self.skipTest("no _site/index.html — run the build first")
        self.assertFalse(
            os.path.exists(os.path.join(site, "grade-5-english-curriculum-exam-L1-5-A")),
            "the Grade 5 English source folder must never be built into _site",
        )
        self.assertFalse(
            os.path.exists(os.path.join(site, "grade-5-english-curriculum-exam-L1-5 (25Q) A")),
            "the Grade 5 English (25Q) A source folder must never be built into _site",
        )
        with open(index, "r", encoding="utf-8") as fh:
            page = fh.read()
        self.assertNotIn('href="./grade-5-english-curriculum-exam-L1-5-A/"', page)
        self.assertNotIn('href="./grade-5-english-curriculum-exam-L1-5 (25Q) A/"', page)
        self.assertIn('href="./grade5-english-curriculum-exam-l1-5-a/"', page)
        self.assertIn('href="./grade5-english-curriculum-exam-l1-5-25q-a/"', page)


class SemesterStructure(Landing):
    """الطبقة الجديدة: الصف ← الفصل الدراسي ← المادة ← الاختبار."""

    EXAMS = [
        ("grade4-adam-test", "اختبار الرياضيات — الصف الرابع"),
        ("grade4-adam-test-2", "اختبار الرياضيات ٢ — الصف الرابع"),
        ("grade5-arabic-exam", "اختبار اللغة العربية — الصف الخامس"),
        ("grade7-physics-exam", "اختبار الفيزياء — الصف السابع"),
        ("grade8-chemistry-exam", "اختبار الكيمياء — الصف الثامن"),
    ]

    def test_every_grade_shows_the_two_semesters_first(self):
        page = self.build(self.EXAMS)
        for grade in range(1, 10):
            self.assertEqual(
                self.semester_cards(page, grade), ["s1", "s2"],
                "grade %d must show الفصل الأول and الفصل الثاني" % grade,
            )
            grade_view = re.search(
                r'<section class="view" id="view-grade-%d".*?</section>' % grade,
                page, re.S,
            ).group(0)
            self.assertNotIn("data-subject=", grade_view,
                             "grade %d must not list subjects before the semester" % grade)
            self.assertIn('href="#g%d/s1"' % grade, grade_view)
            self.assertIn('href="#g%d/s2"' % grade, grade_view)

    def test_all_exams_are_under_the_first_semester(self):
        page = self.build(self.EXAMS)
        for folder, title in self.EXAMS:
            grade = generate.detect_grade(title.lower())
            subject = generate.detect_subject(title.lower())
            self.assertIn(
                folder, self.exam_cards(page, grade, "s1", subject),
                "%s must be listed under الفصل الأول" % folder,
            )
        # لا مشهد اختبارات للفصل الثاني ما دام لا اختبارات فيه
        self.assertEqual(
            [m for m in re.findall(r'id="view-exams-[^"]+"', page) if "-s2-" in m],
            [], "no second-semester exam view should exist yet",
        )

    def test_every_exam_appears_exactly_once(self):
        page = self.build(self.EXAMS)
        for folder, _ in self.EXAMS:
            occurrences = page.count('href="./%s/"' % folder)
            self.assertEqual(occurrences, 1,
                             "%s must appear exactly once (found %d)" % (folder, occurrences))
        self.assertEqual(len(re.findall(r'href="\./[^"/]+/"', page)), len(self.EXAMS))

    def test_semester_two_fixture_is_supported(self):
        """fixture للفصل الثاني: يدخل تلقائيًا في فصله ولا يختلط بالفصل الأول."""
        fixture = ("grade8-math-semester2-fixture", "اختبار الرياضيات — الصف الثامن — الفصل الثاني")
        page = self.build(self.EXAMS + [fixture])
        folder = fixture[0]
        self.assertIn(folder, self.exam_cards(page, 8, "s2", "math"))
        self.assertNotIn(folder, self.exam_cards(page, 8, "s1", "math"))
        self.assertIn('id="view-exams-8-s2-math"', page)
        self.assertEqual(page.count('href="./%s/"' % folder), 1)
        s2_view = re.search(
            r'<section class="view" id="view-sem-8-s2".*?</section>', page, re.S
        ).group(0)
        self.assertIn('href="#g8/s2/math"', s2_view)
        # الفصل الأول يبقى كما هو
        self.assertEqual(
            self.exam_cards(page, 8, "s1", "chemistry"), ["grade8-chemistry-exam"]
        )

    def test_second_semester_views_exist_even_when_empty(self):
        page = self.build(self.EXAMS)
        for grade in range(1, 10):
            self.assertIn('id="view-sem-%d-s2"' % grade, page)
            self.assertIn('href="#g%d/s2"' % grade, page)

    def test_explicit_semester_override(self):
        fixture = ("grade5-arabic-exam", "اختبار اللغة العربية — الصف الخامس")
        overrides = os.path.join(self.tmp, "exams.json")
        with open(overrides, "w", encoding="utf-8") as fh:
            json.dump({"overrides": {"grade5-arabic-exam": {"semester": 2}}}, fh)
        original = generate.OVERRIDES_FILE
        generate.OVERRIDES_FILE = overrides
        try:
            page = self.build([fixture])
        finally:
            generate.OVERRIDES_FILE = original
        self.assertIn("grade5-arabic-exam", self.exam_cards(page, 5, "s2", "arabic"))
        self.assertNotIn("grade5-arabic-exam", self.exam_cards(page, 5, "s1", "arabic"))

    def test_exams_without_info_default_to_first_semester(self):
        site = make_site(self.tmp, [
            ("grade6-mia-test", "اختبار الرياضيات — الصف السادس"),
            ("grade8-physics-exam-2", "اختبار الفيزياء — الصف الثامن — الوحدة الثانية"),
            ("grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2", "اختبار العربية — الصف الخامس"),
        ])
        exams = generate.collect_exams(site)
        self.assertEqual(len(exams), 3)
        for exam in exams:
            self.assertEqual(exam["semester"], 1, exam["folder"])
            self.assertEqual(exam["semester_key"], "s1")
            self.assertEqual(exam["semester_source"], "default")

    def test_semester_detection_patterns(self):
        yes_second = [
            "اختبار الرياضيات — الصف الثامن — الفصل الثاني",
            "اختبار العلوم — الفصل الثانى",
            "Math exam — semester 2",
            "math term 2 test",
            "grade8-math-s2-exam",
        ]
        for text in yes_second:
            self.assertEqual(generate.detect_semester(text)[0], 2, text)
        self.assertEqual(
            generate.detect_semester("اختبار الرياضيات — الفصل الأول")[0], 1)
        # أسماء مجلدات حقيقية لا تُفسَّر خطأً كفصل ثانٍ
        for text in ("grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2",
                     "grade8-physics-exam-2", "grade4-adam-test-2"):
            self.assertEqual(generate.detect_semester(text)[0], 0, text)

    def test_no_fake_exam_is_published(self):
        """fixture الفصل الثاني يبقى في الاختبارات فقط ولا يصل إلى _site الحقيقي."""
        site = os.path.join(ROOT, "_site")
        if not os.path.isdir(site):
            self.skipTest("no _site directory")
        self.assertFalse(
            os.path.exists(os.path.join(site, "grade8-math-semester2-fixture")),
            "the second-semester fixture must never be published",
        )


class GateMarkup(Landing):
    """بوابة الدخول: لا يظهر أي محتوى للمنصة قبل كلمة المرور."""

    def build_with_app(self):
        return self.build([("grade4-adam-test", "اختبار الرياضيات — الصف الرابع")])

    def test_platform_is_wrapped_in_a_hidden_container(self):
        page = self.build_with_app()
        self.assertIn('<div id="app" hidden>', page)
        self.assertLess(page.index('id="gate"'), page.index('<div id="app" hidden>'))
        # كل عناصر المنصة داخل #app المخفي، فلا تظهر قبل البوابة
        for marker in ('<header class="hero">', 'class="crumbs shell"',
                       '<main class="shell stage"', '<footer class="shell foot">'):
            self.assertIn(marker, page)
            self.assertLess(page.index('<div id="app" hidden>'), page.index(marker))
        # #app يُغلق بعد التذييل وقبل سكربت البوابة
        close = page.index("</div>", page.index("</footer>"))
        self.assertLess(page.index('<main class="shell stage"'), page.index('</footer>'))
        self.assertLess(close, page.index('<script id="gate-script">'))

    def test_gate_has_password_field_and_hidden_error(self):
        page = self.build_with_app()
        self.assertIn('id="gate-password"', page)
        self.assertIn('type="password"', page)
        self.assertIn('id="gate-error" role="alert" hidden', page)
        self.assertNotIn("بوابة عرض فقط", page)
        self.assertNotIn("لا تمنع الوصول التقني", page)
        self.assertNotIn('id="gate-note"', page)
        self.assertNotIn('aria-describedby="gate-note"', page)
        self.assertIn('id="gate-script"', page)
        self.assertIn("sessionStorage", page)

    def test_exam_links_stay_outside_the_gate_rules(self):
        page = self.build_with_app()
        gate = re.search(r'<section class="gate".*?</section>', page, re.S).group(0)
        self.assertNotIn('href="./grade4-adam-test/"', gate)
        self.assertIn('href="./grade4-adam-test/"', page)

    def test_password_is_not_required_on_exam_pages(self):
        site = os.path.join(ROOT, "_site")
        if not os.path.isdir(site):
            self.skipTest("no _site directory")
        folders = [
            name for name in os.listdir(site)
            if os.path.isfile(os.path.join(site, name, "index.html"))
        ]
        self.assertTrue(folders)
        for folder in folders:
            with open(os.path.join(site, folder, "index.html"), "r",
                      encoding="utf-8", errors="ignore") as fh:
                content = fh.read()
            for marker in ("tests-platform-gate-v1", 'id="gate-password"',
                           'id="gate-form"'):
                self.assertNotIn(marker, content,
                                 "%s must not contain the index gate" % folder)


class CairoTypography(Landing):
    """خط Cairo الموحّد: محمَّل محليًا ومطبَّق على جميع عناصر ومشاهد المنصة."""

    FONT_FILES = (
        "cairo-arabic-wght-normal.woff2",
        "cairo-latin-wght-normal.woff2",
        "cairo-latin-ext-wght-normal.woff2",
    )

    def test_local_cairo_woff2_files_are_copied_and_valid(self):
        site = make_site(self.tmp, [("grade4-adam-test", "اختبار الرياضيات — الصف الرابع")])
        generate.main(["generate.py", site])
        for filename in self.FONT_FILES:
            path = os.path.join(site, "fonts", filename)
            self.assertTrue(os.path.isfile(path), "missing font file: %s" % filename)
            with open(path, "rb") as fh:
                magic = fh.read(4)
            self.assertEqual(magic, b"wOF2", "%s is not a valid WOFF2 font" % filename)

    def test_cairo_is_primary_font_for_all_elements(self):
        page = self.build([("grade4-adam-test", "اختبار الرياضيات — الصف الرابع")])
        for filename in self.FONT_FILES:
            self.assertIn('./fonts/%s' % filename, page)
        self.assertEqual(len(re.findall(r'@font-face\s*\{[^}]*font-family:\s*"Cairo"', page)), 3)
        self.assertRegex(page, r'--font:\s*"Cairo",')
        self.assertRegex(
            page,
            r"button,\s*input,\s*select,\s*textarea,\s*optgroup,\s*kbd,\s*code,\s*pre,\s*samp\s*\{\s*font-family:\s*var\(--font\);\s*\}",
        )
        self.assertRegex(
            page,
            r"input::placeholder,\s*textarea::placeholder\s*\{\s*font-family:\s*var\(--font\);\s*\}",
        )
        style = re.search(r"<style>(.*?)</style>", page, re.S).group(1)
        without_faces = re.sub(r"@font-face\s*\{[^}]*\}", "", style)
        families = re.findall(r"font-family\s*:\s*([^;}]+)", without_faces)
        self.assertTrue(families)
        for fam in families:
            self.assertEqual(fam.strip(), "var(--font)",
                             "unexpected non-Cairo font-family override: %s" % fam)


class RealSiteSemesters(unittest.TestCase):
    """تحقق من الموقع الحقيقي المبني: فصول ومادة كل اختبار وروابطه."""

    def setUp(self):
        self.cwd = os.getcwd()
        os.chdir(ROOT)

    def tearDown(self):
        os.chdir(self.cwd)

    def site(self):
        site = os.path.join(ROOT, "_site")
        index = os.path.join(site, "index.html")
        if not os.path.isfile(index):
            self.skipTest("no _site/index.html — run the build first")
        with open(index, "r", encoding="utf-8") as fh:
            return site, fh.read()

    def test_real_exams_are_placed_once_in_their_own_semester(self):
        site, page = self.site()
        exams = generate.collect_exams(site)
        self.assertTrue(exams)
        for exam in exams:
            view_id = 'id="view-exams-%d-%s-%s"' % (
                exam["grade"], exam["semester_key"], exam["subject"])
            self.assertIn(view_id, page, exam["folder"])
            self.assertIn('data-semester="%s"' % exam["semester_key"], page)
            self.assertEqual(page.count('href="%s"' % exam["url"]), 1,
                             "%s must be linked exactly once" % exam["folder"])
        self.assertEqual(
            len(re.findall(r'href="\./[^"/]+/"', page)), len(exams))

    def test_all_current_exams_are_in_the_first_semester(self):
        """حالة المستودع الحالية: كل الاختبارات المنشورة من الفصل الأول.

        عند إضافة أول اختبار للفصل الثاني مستقبلًا، يُحدَّث هذا الاختبار
        (وأخواه أدناه) ليصبح الفصل الثاني متوقعًا — وهذا هو الغرض منه.
        """
        site, _ = self.site()
        exams = generate.collect_exams(site)
        self.assertTrue(exams)
        for exam in exams:
            self.assertEqual(exam["semester"], 1, exam["folder"])
            self.assertEqual(exam["semester_key"], "s1", exam["folder"])

    def test_real_page_has_no_second_semester_exams_yet(self):
        """لا اختبار حقيقي في الفصل الثاني بعد — الفصل الثاني بنية جاهزة فقط."""
        _, page = self.site()
        self.assertEqual(
            [m for m in re.findall(r'id="view-exams-[^"]+"', page) if "-s2-" in m], [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
