#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""توليد صفحة الفهرس (_site/index.html) لمنصة الاختبارات.

السكربت يقرأ المجلدات المنشورة داخل _site (مجلد لكل اختبار، وفيه index.html)
ويبني صفحة عربية واحدة تعرض الاختبارات في ثلاث خطوات: الصف ← المادة ← الاختبار.

قواعد ظهور المواد مضبوطة في SUBJECTS أدناه، ويمكن تعديلها من مكان واحد:

    · اللغة العربية، الرياضيات، اللغة الإنجليزية ← الصفوف 1 – 9
    · الفيزياء، الكيمياء                        ← الصفوف 7 – 9 فقط

السكربت يستخدم مكتبة بايثون القياسية فقط، ولا يعدّل أي ملف اختبار:
يقرأ <title> من كل صفحة منشورة ليصنّفها، تمامًا كما كان يفعل سكربت النشر
القديم، ويبني الروابط نفسها (./<اسم المجلد>/) من دون أي تغيير.

الاستخدام:
    python3 landing/generate.py _site
"""

import html
import json
import os
import re
import sys
from urllib.parse import quote

# ---------------------------------------------------------------------------
# 1. قاعدة المواد: أي مادة تظهر لأي صف؟ (تعديل هذه القاعدة يتم من هنا فقط)
# ---------------------------------------------------------------------------
GRADES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع"]
GRADE_MIN, GRADE_MAX = 1, 9

# key, الاسم المعروض, رمز الأيقونة, درجة اللون (hue), الصفوف التي تظهر فيها
SUBJECTS = [
    ("arabic",    "اللغة العربية",    "#s-arabic",    158, (1, 2, 3, 4, 5, 6, 7, 8, 9)),
    ("math",      "الرياضيات",        "#s-math",      258, (1, 2, 3, 4, 5, 6, 7, 8, 9)),
    ("english",   "اللغة الإنجليزية", "#s-english",   32,  (1, 2, 3, 4, 5, 6, 7, 8, 9)),
    ("physics",   "الفيزياء",         "#s-physics",   199, (7, 8, 9)),
    ("chemistry", "الكيمياء",         "#s-chemistry", 330, (7, 8, 9)),
]

# لون كل صف (درجة اللون) — يمنح كل بطاقة صف شخصية بصرية خاصة
GRADE_HUES = {1: 14, 2: 38, 3: 96, 4: 152, 5: 190, 6: 222, 7: 258, 8: 292, 9: 338}

# أنماط التصنيف التلقائي: العنوان أولًا، ثم اسم المجلد
GRADE_WORDS = "|".join(GRADES)
GRADE_RE = re.compile(
    r"(?:الصف\s*)?(?:الصف\s*)?(" + GRADE_WORDS + r")\b|grade[-_ ]?([1-9])\b"
)
SUBJECT_PATTERNS = [
    ("arabic", re.compile(r"العربية|اللغه العربيه|arabic")),
    ("math", re.compile(r"الرياضيات|رياضيات|ماث|math")),
    ("physics", re.compile(r"الفيزياء|فيزياء|physics")),
    ("chemistry", re.compile(r"الكيمياء|كيمياء|chemistry")),
    ("english", re.compile(r"الإنجليزية|الانجليزية|الإنجليزي|الانجليزي|english")),
]

OVERRIDES_FILE = os.path.join("landing", "exams.json")
TEMPLATE_FILE = os.path.join("landing", "template.html")

AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"
EMPTY_EXAM_TEXT = "لا توجد اختبارات بعد"
EMPTY_GRADE_TEXT = "لم يُنشر أي اختبار لهذا الصف بعد"


# ---------------------------------------------------------------------------
# 2. أدوات مساعدة
# ---------------------------------------------------------------------------
def ar(n):
    """أرقام عربية-هندية: 7 ← ٧"""
    return "".join(AR_DIGITS[int(ch)] if ch.isdigit() else ch for ch in str(n))


def count_exams(n):
    if n == 0:
        return EMPTY_EXAM_TEXT
    if n == 1:
        return "اختبار واحد"
    if n == 2:
        return "اختباران"
    if n <= 10:
        return "%s اختبارات" % ar(n)
    return "%s اختبارًا" % ar(n)


def count_subjects(n):
    if n == 0:
        return "لا مواد بعد"
    if n == 1:
        return "مادة واحدة"
    if n == 2:
        return "مادتان"
    if n <= 10:
        return "%s مواد" % ar(n)
    return "%s مادة" % ar(n)


def normalize(text):
    """تطبيع النص للبحث: إزالة التشكيل وتوحيد الألف والياء والتاء والأرقام."""
    text = re.sub("[\u064b-\u065f\u0670\u0640]", "", text or "")
    text = re.sub("[\u0622\u0623\u0625\u0627\u0671]", "\u0627", text)
    text = re.sub(r"[ىي]", "ي", text)
    text = text.replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    text = re.sub(r"[٠-٩]", lambda m: str(ord(m.group(0)) - 0x0660), text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def icon(name, cls=""):
    return '<svg viewBox="0 0 24 24" aria-hidden="true"%s><use href="%s" /></svg>' % (
        ' class="%s"' % cls if cls else "",
        name,
    )


def e(text):
    return html.escape(str(text), quote=True)


# ---------------------------------------------------------------------------
# 3. قراءة الاختبارات المنشورة وتصنيفها
# ---------------------------------------------------------------------------
def load_overrides():
    """تصنيف يدوي اختياري من landing/exams.json — يُستخدم عند الحاجة فقط."""
    if not os.path.isfile(OVERRIDES_FILE):
        return {}
    try:
        with open(OVERRIDES_FILE, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (ValueError, OSError) as error:
        sys.stderr.write("::warning:: Could not read %s (%s)\n" % (OVERRIDES_FILE, error))
        return {}
    return data.get("overrides") or {}


def detect_grade(evidence):
    match = GRADE_RE.search(evidence)
    if not match:
        return 0
    if match.group(2):
        return int(match.group(2))
    return GRADES.index(match.group(1)) + 1


def detect_subject(evidence):
    for key, pattern in SUBJECT_PATTERNS:
        if pattern.search(evidence):
            return key
    return ""


def collect_exams(site_dir):
    """يقرأ المجلدات المنشورة ويعيد قائمة الاختبارات المصنّفة."""
    exams = []
    if not os.path.isdir(site_dir):
        return exams
    overrides = load_overrides()
    for name in sorted(os.listdir(site_dir)):
        folder = os.path.join(site_dir, name)
        page = os.path.join(folder, "index.html")
        if not os.path.isdir(folder) or not os.path.isfile(page):
            continue
        with open(page, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()
        match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
        title = html.unescape(match.group(1)).strip() if match else name
        # العنوان هو المرجع الأول للتصنيف، واسم المجلد احتياط (كما في السكربت القديم).
        evidence = (title + " " + name).lower()
        grade = detect_grade(evidence)
        subject = detect_subject(evidence)

        override = overrides.get(name) or {}
        grade = int(override.get("grade", grade) or 0)
        subject = override.get("subject", subject) or subject
        title = override.get("title", title) or title
        if not grade or not subject:
            continue
        exams.append(
            {
                "folder": name,
                "title": title,
                "grade": grade,
                "subject": subject,
                "url": "./%s/" % quote(name),
            }
        )
    return exams


def subjects_for_grade(grade):
    return [row for row in SUBJECTS if grade in row[4]]


def subject_label(key):
    for row in SUBJECTS:
        if row[0] == key:
            return row[1]
    return key


def subject_icon(key):
    for row in SUBJECTS:
        if row[0] == key:
            return row[2]
    return "#s-arabic"


def subject_hue(key):
    for row in SUBJECTS:
        if row[0] == key:
            return row[3]
    return 222


# ---------------------------------------------------------------------------
# 4. بناء الواجهة
# ---------------------------------------------------------------------------
def grade_name(grade):
    return "الصف %s" % GRADES[grade - 1]


def build_home(exams_by_cell):
    cards = []
    for grade in range(GRADE_MIN, GRADE_MAX + 1):
        rows = subjects_for_grade(grade)
        total = sum(len(exams_by_cell.get((grade, row[0]), [])) for row in rows)
        active = [row for row in rows if exams_by_cell.get((grade, row[0]))]
        dots = []
        for row in rows:
            on = bool(exams_by_cell.get((grade, row[0])))
            dots.append('<i style="--h2:%d" class="%s"></i>' % (row[3], "is-on" if on else "is-off"))
        meta = "%s · %s" % (count_subjects(len(active)), count_exams(total)) if total else EMPTY_EXAM_TEXT
        cards.append(
"""      <a class="grade-card%s stagger" style="--h:%d;--i:%d" href="#g%d">
        <span class="go" aria-hidden="true">%s</span>
        <span class="grade-card__num" aria-hidden="true">%s</span>
        <span class="grade-card__name">%s</span>
        <span class="grade-card__meta">%s</span>
        <span class="grade-card__dots" aria-hidden="true">%s</span>
      </a>
"""
            % (
                " is-empty" if not total else "",
                GRADE_HUES[grade],
                grade - 1,
                grade,
                icon("#s-chev", "ic-fwd"),
                ar(grade),
                grade_name(grade),
                meta,
                "".join(dots),
            )
        )
    return """  <section class="view" id="view-home" data-label="" hidden>
    <h2 class="sect-title">اختر الصف <span>%s صفًّا دراسيًا</span></h2>
    <div class="grid grid--grades">
%s    </div>
  </section>
""" % (
        ar(GRADE_MAX),
        "".join(cards),
    )


def build_grade_view(grade, exams_by_cell):
    cards = []
    for index, (key, label, icon_name, hue, _) in enumerate(subjects_for_grade(grade)):
        items = exams_by_cell.get((grade, key), [])
        if items:
            meta = count_exams(len(items))
            cards.append(
                """      <a class="subject-card stagger" style="--h:%d;--i:%d" data-subject="%s" href="#g%d/%s">
        <span class="subject-card__icon">%s</span>
        <span class="subject-card__name">%s</span>
        <span class="subject-card__meta">%s</span>
        <span class="go" aria-hidden="true">%s</span>
      </a>
"""
                % (
                    hue,
                    index,
                    key,
                    grade,
                    key,
                    icon(icon_name),
                    label,
                    meta,
                    icon("#s-chev", "ic-fwd"),
                )
            )
        else:
            cards.append(
                """      <div class="subject-card is-empty stagger" style="--h:%d;--i:%d" data-subject="%s" aria-disabled="true">
        <span class="subject-card__icon">%s</span>
        <span class="subject-card__name">%s</span>
        <span class="subject-card__meta">%s</span>
      </div>
"""
                % (hue, index, key, icon(icon_name), label, EMPTY_EXAM_TEXT)
            )
    total = sum(len(exams_by_cell.get((grade, row[0]), [])) for row in subjects_for_grade(grade))
    return """  <section class="view" id="view-grade-%d" data-label="%s" style="--h:%d" hidden>
    <div class="view-head">
      <button type="button" class="back" data-go="">%s كل الصفوف</button>
      <span class="view-head__icon" aria-hidden="true">%s</span>
      <div class="view-head__text">
        <h2>%s</h2>
        <p>اختر المادة — %s</p>
      </div>
    </div>
    <div class="grid grid--subjects">
%s    </div>
  </section>
""" % (
        grade,
        e(grade_name(grade)),
        GRADE_HUES[grade],
        icon("#s-chev", "ic-back"),
        icon("#s-grades"),
        grade_name(grade),
        count_exams(total),
        "".join(cards),
    )


def build_exams_view(grade, key, items):
    hue = subject_hue(key)
    cards = []
    for index, exam in enumerate(items):
        searchable = "%s %s %s %s %s" % (
            exam["title"],
            subject_label(key),
            grade_name(grade),
            GRADES[grade - 1],
            exam["folder"],
        )
        cards.append(
            """      <a class="exam-card stagger" style="--i:%d" href="%s"
         data-grade="%d" data-subject="%s" data-hue="%d" data-search="%s">
        <span class="exam-card__idx" aria-hidden="true">%s</span>
        <span>
          <span class="exam-card__title">%s</span>
          <span class="exam-card__path">%s · %s</span>
        </span>
        <span class="exam-card__cta">ابدأ %s</span>
      </a>
"""
            % (
                index,
                e(exam["url"]),
                grade,
                key,
                hue,
                e(normalize(searchable)),
                ar(index + 1),
                e(exam["title"]),
                grade_name(grade),
                subject_label(key),
                icon("#s-arrow", "ic-fwd"),
            )
        )
    return """  <section class="view" id="view-exams-%d-%s" data-label="%s · %s"
           data-grade-label="%s" data-subject-label="%s" style="--h:%d" hidden>
    <div class="view-head">
      <button type="button" class="back" data-go="#g%d">%s كل المواد</button>
      <span class="view-head__icon" aria-hidden="true">%s</span>
      <div class="view-head__text">
        <h2>%s — %s</h2>
        <p>%s</p>
      </div>
    </div>
    <div class="grid grid--exams">
%s    </div>
  </section>
""" % (
        grade,
        key,
        e(grade_name(grade)),
        e(subject_label(key)),
        e(grade_name(grade)),
        e(subject_label(key)),
        hue,
        grade,
        icon("#s-chev", "ic-back"),
        icon(subject_icon(key)),
        subject_label(key),
        grade_name(grade),
        count_exams(len(items)),
        "".join(cards),
    )


def build_stats(exams):
    subjects_used = len({exam["subject"] for exam in exams})
    grades_used = len({exam["grade"] for exam in exams})
    return (
        '<li><b>%s</b> صفًّا دراسيًا</li>'
        '<li><b>%s</b> مادة</li>'
        '<li><b>%s</b> اختبارًا منشورًا</li>'
        % (ar(grades_used), ar(subjects_used), ar(len(exams)))
    )


def build_content(exams):
    exams_by_cell = {}
    for exam in exams:
        exams_by_cell.setdefault((exam["grade"], exam["subject"]), []).append(exam)

    parts = [build_home(exams_by_cell)]
    for grade in range(GRADE_MIN, GRADE_MAX + 1):
        parts.append(build_grade_view(grade, exams_by_cell))
        for key, _, _, _, _ in subjects_for_grade(grade):
            items = exams_by_cell.get((grade, key), [])
            if items:
                parts.append(build_exams_view(grade, key, items))
    return "".join(parts)


def warn_hidden_exams(exams):
    """تنبيه في سجل النشر إن كان اختبار منشور في صف لا تُعرض مادته فيه."""
    for exam in sorted(exams, key=lambda item: item["folder"]):
        allowed = False
        for row in SUBJECTS:
            if row[0] == exam["subject"] and exam["grade"] in row[4]:
                allowed = True
                break
        if not allowed:
            sys.stderr.write(
                "::warning:: %s: مادة «%s» لا تُعرض في %s — لن يظهر هذا الاختبار في الفهرس.\n"
                % (exam["folder"], subject_label(exam["subject"]), grade_name(exam["grade"]))
            )
        elif not (GRADE_MIN <= exam["grade"] <= GRADE_MAX):
            sys.stderr.write(
                "::warning:: %s: الصف %s خارج نطاق الفهرس (1 – 9).\n"
                % (exam["folder"], exam["grade"])
            )


def main(argv):
    site_dir = argv[1] if len(argv) > 1 else "_site"
    template_path = TEMPLATE_FILE
    if not os.path.isfile(template_path):
        template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "template.html")
    with open(template_path, "r", encoding="utf-8") as fh:
        template = fh.read()

    exams = collect_exams(site_dir)
    warn_hidden_exams(exams)

    page = template.replace("__STATS__", build_stats(exams)).replace(
        "__CONTENT__", build_content(exams)
    )
    for token in ("__STATS__", "__CONTENT__"):
        if token in page:
            raise SystemExit("لم يتم استبدال %s في القالب" % token)

    out = os.path.join(site_dir, "index.html")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(page)

    print(
        "Generated %s — %d exam(s) across %d grade(s): %s"
        % (
            out,
            len(exams),
            len({exam["grade"] for exam in exams}),
            ", ".join(exam["folder"] for exam in exams),
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
