#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""توليد صفحة الفهرس (_site/index.html) لمنصة الاختبارات.

السكربت يقرأ المجلدات المنشورة داخل _site (مجلد لكل اختبار، وفيه index.html)
ويبني صفحة عربية واحدة تعرض الاختبارات في أربع خطوات:

    الصف ← الفصل الدراسي ← المادة ← الاختبار

لكل اختبار فصل دراسي (semester) صريح في بياناته، ويُشتق كالتالي:

    1) حقل "semester" في landing/exams.json إن وُجد (أعلى أولوية).
    2) كلمات صريحة في العنوان أو اسم المجلد، مثل «الفصل الثاني» أو
       «semester 2» أو «s2» أو «term 2».
    3) وإلا يُسند الاختبار إلى الفصل الأول (SEMESTER_DEFAULT = 1) — وهو ما
       ينطبق على كل اختبارات المنصة الحالية، لأنها كلها من الفصل الأول.
       تُطبع في سجل التوليد عبارة توضّح عدد الاختبارات التي أُسندت افتراضيًا.

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
import shutil
import subprocess
import sys
from urllib.parse import quote

# ---------------------------------------------------------------------------
# 1. قاعدة المواد: أي مادة تظهر لأي صف؟ (تعديل هذه القاعدة يتم من هنا فقط)
# ---------------------------------------------------------------------------
GRADES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع"]
GRADE_MIN, GRADE_MAX = 1, 9

# ---------------------------------------------------------------------------
# 1-ب. الفصل الدراسي: طبقة بين الصف والمادة (تعديل القاعدة من هنا فقط)
# ---------------------------------------------------------------------------
# key, الرقم, الاسم المعروض, رمز الأيقونة, درجة اللون (hue)
SEMESTERS = [
    ("s1", 1, "الفصل الأول",  "#s-sun",  210),
    ("s2", 2, "الفصل الثاني", "#s-leaf", 278),
]

# الفصل الافتراضي لأي اختبار لا يحمل معلومة فصل صريحة.
# كل اختبارات المنصة الحالية تخص الفصل الأول، لذا تُسند إليه تلقائيًا.
SEMESTER_DEFAULT = 1

# أنماط استخراج الفصل من العنوان أو اسم المجلد (بعد التطبيع إلى أحرف صغيرة)
SEMESTER_PATTERNS = [
    (2, re.compile(
        r"الفصل\s+الثاني|الفصل\s+الثانى|الفصل\s+الثانوي|الترم\s+الثاني|الترم\s+الثانى"
        r"|semester\s*[-_ ]?\s*(?:2|ii)\b|term\s*[-_ ]?\s*2\b"
        r"|(?<![a-z0-9])s2(?![0-9])|(?<![a-z0-9])sem2(?![0-9])"
    )),
    (1, re.compile(
        r"الفصل\s+الأول|الفصل\s+الاول|الترم\s+الأول|الترم\s+الاول"
        r"|semester\s*[-_ ]?\s*(?:1|i)\b|term\s*[-_ ]?\s*1\b"
        r"|(?<![a-z0-9])s1(?![0-9])|(?<![a-z0-9])sem1(?![0-9])"
    )),
]

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
FONTS_DIR = os.path.join("landing", "fonts")

# الأرقام الظاهرة في الواجهة إنجليزية دائمًا (0-9)؛ أي رقم عربي-هندي أو فارسي
# يرد في عنوان اختبار يُحوَّل عند العرض فقط — البيانات والروابط لا تتغيّر.
_EASTERN_DIGITS = {}
for _i in range(10):
    _EASTERN_DIGITS[0x0660 + _i] = str(_i)  # ٠-٩
    _EASTERN_DIGITS[0x06F0 + _i] = str(_i)  # ۰-۹
DATE_RE = re.compile(r"^\d{2}-\d{2}-\d{4}$")
META_ADDED_AT_RE = re.compile(
    r'<meta\b[^>]*name=["\']exam-added-at["\'][^>]*content=["\'](\d{2}-\d{2}-\d{4})["\']',
    re.IGNORECASE,
)
EMPTY_EXAM_TEXT = "لا توجد اختبارات بعد"
EMPTY_GRADE_TEXT = "لم يُنشر أي اختبار لهذا الصف بعد"


# ---------------------------------------------------------------------------
# 2. أدوات مساعدة
# ---------------------------------------------------------------------------
def num(value):
    """أرقام إنجليزية للعرض: 7 ← 7 ، ٧ ← 7"""
    return str(value).translate(_EASTERN_DIGITS)


def count_exams(n):
    if n == 0:
        return EMPTY_EXAM_TEXT
    if n == 1:
        return "اختبار واحد"
    if n == 2:
        return "اختباران"
    if n <= 10:
        return "%s اختبارات" % num(n)
    return "%s اختبارًا" % num(n)


def count_subjects(n):
    if n == 0:
        return "لا مواد بعد"
    if n == 1:
        return "مادة واحدة"
    if n == 2:
        return "مادتان"
    if n <= 10:
        return "%s مواد" % num(n)
    return "%s مادة" % num(n)


def normalize(text):
    """تطبيع النص للبحث: إزالة التشكيل وتوحيد الألف والياء والتاء والأرقام."""
    text = re.sub("[\u064b-\u065f\u0670\u0640]", "", text or "")
    text = re.sub("[\u0622\u0623\u0625\u0627\u0671]", "\u0627", text)
    text = re.sub(r"[ىي]", "ي", text)
    text = text.replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    text = num(text)
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


def detect_semester(evidence):
    """يعيد (رقم الفصل, مصدره) أو (0, "") إن لم توجد معلومة صريحة."""
    for number, pattern in SEMESTER_PATTERNS:
        if pattern.search(evidence):
            return number, "detected"
    return 0, ""


def as_semester(value):
    """يحوّل قيمة يدوية (1 / 2 / "1" / "2" / "s1" / "s2") إلى رقم فصل."""
    if isinstance(value, bool):
        return 0
    if isinstance(value, int):
        return value if value in (1, 2) else 0
    text = normalize(str(value or ""))
    if text in ("1", "s1", "sem1", "الفصل الاول", "الاول"):
        return 1
    if text in ("2", "s2", "sem2", "الفصل الثاني", "الثاني"):
        return 2
    return 0


def valid_date(value):
    text = num(str(value or "")).strip()
    return text if DATE_RE.match(text) else ""


def git_added_date(folder):
    """يستخرج تاريخ أول إضافة للمجلد من Git إن وُجد سجل غير مبتور (بدون تخمين)."""
    if not os.path.isdir(folder):
        return ""
    try:
        proc = subprocess.run(
            [
                "git",
                "log",
                "--diff-filter=A",
                "--follow",
                "--reverse",
                "--format=%H\t%cd",
                "--date=format:%d-%m-%Y",
                "--",
                folder,
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0 or not proc.stdout.strip():
            return ""
        first_line = proc.stdout.strip().splitlines()[0]
        if "\t" not in first_line:
            return ""
        sha, date_str = first_line.split("\t", 1)
        # تأكد أن الـ commit ليس جذر نسخة shallow مبتورة
        parent = subprocess.run(
            ["git", "rev-parse", "--verify", "--quiet", sha + "^"],
            capture_output=True,
            text=True,
            check=False,
        )
        if parent.returncode != 0:
            return ""
        return valid_date(date_str)
    except OSError:
        return ""


def resolve_added_at(folder, content, override):
    """يحدّد تاريخ إضافة الاختبار الثابت:
    1) الحقل addedAt في landing/exams.json (ثابت عبر إعادة البناء).
    2) وسم <meta name="exam-added-at" content="DD-MM-YYYY"> في صفحة الاختبار.
    3) تاريخ أول إضافة للمجلد في سجل Git الكامل (إن لم يكن shallow root).
    4) وإلا فارغ "" (لا اختراع لتواريخ الاختبارات القديمة).
    """
    from_override = valid_date(override.get("addedAt"))
    if from_override:
        return from_override
    meta_match = META_ADDED_AT_RE.search(content)
    if meta_match:
        from_meta = valid_date(meta_match.group(1))
        if from_meta:
            return from_meta
    return git_added_date(folder)


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
        evidence = title + " " + name
        plain = evidence.lower()   # العربية لا تتغيّر، والأنماط اللاتينية صغيرة
        grade = detect_grade(plain)
        subject = detect_subject(plain)
        semester, semester_source = detect_semester(plain + " " + normalize(evidence))

        override = overrides.get(name) or {}
        grade = int(override.get("grade", grade) or 0)
        subject = override.get("subject", subject) or subject
        title = override.get("title", title) or title
        if "semester" in override:
            manual = as_semester(override.get("semester"))
            if manual:
                semester, semester_source = manual, "override"
        # قاعدة الأمان: أي اختبار بلا معلومة فصل صريحة يُسند إلى الفصل الأول.
        if not semester:
            semester, semester_source = SEMESTER_DEFAULT, "default"
        if not grade or not subject:
            continue
        added_at = resolve_added_at(name, content, override)
        exams.append(
            {
                "folder": name,
                "title": title,
                "grade": grade,
                "subject": subject,
                "semester": semester,
                "semester_key": semester_key(semester),
                "semester_label": semester_name(semester),
                "semester_source": semester_source,
                "added_at": added_at,
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


def semester_row(number):
    for row in SEMESTERS:
        if row[1] == number:
            return row
    return SEMESTERS[0]


def semester_key(number):
    return semester_row(number)[0]


def semester_name(number):
    return semester_row(number)[2]


def semester_icon(number):
    return semester_row(number)[3]


def semester_hue(number):
    return semester_row(number)[4]


# ---------------------------------------------------------------------------
# 4. بناء الواجهة
# ---------------------------------------------------------------------------
def grade_name(grade):
    return "الصف %s" % GRADES[grade - 1]


def build_home(exams_by_cell):
    """مشهد الصفوف: يبقى كما هو، وتُحسب فيه اختبارات الفصلين معًا."""
    cards = []
    for grade in range(GRADE_MIN, GRADE_MAX + 1):
        rows = subjects_for_grade(grade)
        total = sum(
            len(exams_by_cell.get((grade, row[1], subject[0]), []))
            for row in SEMESTERS
            for subject in rows
        )
        active = [
            subject for subject in rows
            if any(exams_by_cell.get((grade, row[1], subject[0])) for row in SEMESTERS)
        ]
        dots = []
        for subject in rows:
            on = any(
                exams_by_cell.get((grade, row[1], subject[0])) for row in SEMESTERS
            )
            dots.append(
                '<i style="--h2:%d" class="%s"></i>'
                % (subject[3], "is-on" if on else "is-off")
            )
        meta = (
            "%s · %s" % (count_subjects(len(active)), count_exams(total))
            if total
            else EMPTY_EXAM_TEXT
        )
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
                num(grade),
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
        num(GRADE_MAX),
        "".join(cards),
    )


def build_grade_view(grade, exams_by_cell):
    """مشهد الصف: بطاقتان واضحتان فقط — الفصل الأول والفصل الثاني."""
    cards = []
    total_all = 0
    for index, (sem_key, sem_number, sem_label, sem_icon, sem_hue) in enumerate(SEMESTERS):
        pairs = [
            (subject, exams_by_cell.get((grade, sem_key, subject[0]), []))
            for subject in subjects_for_grade(grade)
        ]
        total = sum(len(items) for _, items in pairs)
        total_all += total
        active = [subject for subject, items in pairs if items]
        meta = (
            "%s · %s" % (count_subjects(len(active)), count_exams(total))
            if total
            else EMPTY_EXAM_TEXT
        )
        cards.append(
"""      <a class="sem-card%s stagger" style="--h:%d;--i:%d" data-semester="%s" href="#g%d/%s">
        <span class="go" aria-hidden="true">%s</span>
        <span class="sem-card__icon" aria-hidden="true">%s<b class="sem-card__badge">%s</b></span>
        <span class="sem-card__name">%s</span>
        <span class="sem-card__meta">%s</span>
      </a>
"""
            % (
                " is-empty" if not total else "",
                sem_hue,
                index,
                sem_key,
                grade,
                sem_key,
                icon("#s-chev", "ic-fwd"),
                icon(sem_icon),
                num(sem_number),
                sem_label,
                meta,
            )
        )
    return """  <section class="view" id="view-grade-%d" data-label="%s" style="--h:%d" hidden>
    <div class="view-head">
      <button type="button" class="back" data-go="">%s كل الصفوف</button>
      <span class="view-head__icon" aria-hidden="true">%s</span>
      <div class="view-head__text">
        <h2>%s</h2>
        <p>اختر الفصل الدراسي — %s</p>
      </div>
    </div>
    <h2 class="sect-title">الفصل الدراسي <span>%s</span></h2>
    <div class="grid grid--semesters">
%s    </div>
  </section>
""" % (
        grade,
        e(grade_name(grade)),
        GRADE_HUES[grade],
        icon("#s-chev", "ic-back"),
        icon("#s-grades"),
        grade_name(grade),
        count_exams(total_all),
        count_semesters(len(SEMESTERS)),
        "".join(cards),
    )


def build_semester_view(grade, sem_row, exams_by_cell):
    """مشهد الفصل: المواد الموجودة ضمن هذا الفصل في هذا الصف."""
    sem_key, sem_number, sem_label, sem_icon, sem_hue = sem_row
    cards = []
    total = 0
    for index, (key, label, subject_icon_name, hue, _) in enumerate(subjects_for_grade(grade)):
        items = exams_by_cell.get((grade, sem_key, key), [])
        total += len(items)
        if items:
            cards.append(
                """      <a class="subject-card stagger" style="--h:%d;--i:%d" data-subject="%s" data-semester="%s" href="#g%d/%s/%s">
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
                    sem_key,
                    grade,
                    sem_key,
                    key,
                    icon(subject_icon_name),
                    label,
                    count_exams(len(items)),
                    icon("#s-chev", "ic-fwd"),
                )
            )
        else:
            cards.append(
                """      <div class="subject-card is-empty stagger" style="--h:%d;--i:%d" data-subject="%s" data-semester="%s" aria-disabled="true">
        <span class="subject-card__icon">%s</span>
        <span class="subject-card__name">%s</span>
        <span class="subject-card__meta">%s</span>
      </div>
"""
                % (hue, index, key, sem_key, icon(subject_icon_name), label, EMPTY_EXAM_TEXT)
            )
    return """  <section class="view" id="view-sem-%d-%s" data-label="%s · %s"
           data-grade-label="%s" data-semester-label="%s" data-semester="%s"
           style="--h:%d" hidden>
    <div class="view-head">
      <button type="button" class="back" data-go="#g%d">%s كل الفصول</button>
      <span class="view-head__icon" aria-hidden="true">%s</span>
      <div class="view-head__text">
        <h2>%s — %s</h2>
        <p>اختر المادة — %s</p>
      </div>
    </div>
    <div class="grid grid--subjects">
%s    </div>
  </section>
""" % (
        grade,
        sem_key,
        e(grade_name(grade)),
        e(sem_label),
        e(grade_name(grade)),
        e(sem_label),
        sem_key,
        sem_hue,
        grade,
        icon("#s-chev", "ic-back"),
        icon(sem_icon),
        sem_label,
        grade_name(grade),
        count_exams(total),
        "".join(cards),
    )


def build_exams_view(grade, sem_row, key, items):
    sem_key, sem_number, sem_label, sem_icon, _ = sem_row
    hue = subject_hue(key)
    cards = []
    for index, exam in enumerate(items):
        added_at = exam.get("added_at", "")
        searchable = "%s %s %s %s %s %d %s %s" % (
            exam["title"],
            subject_label(key),
            sem_label,
            grade_name(grade),
            GRADES[grade - 1],
            grade,
            exam["folder"],
            added_at,
        )
        added_attr = ' data-added-at="%s"' % e(added_at) if added_at else ""
        date_badge = (
            '\n            <span class="exam-card__date" dir="ltr">%s</span>' % e(added_at)
            if added_at
            else ""
        )
        cards.append(
            """      <a class="exam-card stagger" style="--i:%d" href="%s"
         data-grade="%d" data-semester="%s" data-subject="%s" data-hue="%d" data-search="%s"%s>
        <span class="exam-card__idx" aria-hidden="true">%s</span>
        <span>
          <span class="exam-card__title">%s</span>
          <span class="exam-card__meta">
            <span class="exam-card__path">%s · %s · %s</span>%s
          </span>
        </span>
        <span class="exam-card__cta">ابدأ %s</span>
      </a>
"""
            % (
                index,
                e(exam["url"]),
                grade,
                sem_key,
                key,
                hue,
                e(normalize(searchable)),
                added_attr,
                num(index + 1),
                e(num(exam["title"])),
                grade_name(grade),
                sem_label,
                subject_label(key),
                date_badge,
                icon("#s-arrow", "ic-fwd"),
            )
        )
    return """  <section class="view" id="view-exams-%d-%s-%s" data-label="%s · %s · %s"
           data-grade-label="%s" data-semester-label="%s" data-subject-label="%s"
           data-semester="%s" style="--h:%d" hidden>
    <div class="view-head">
      <button type="button" class="back" data-go="#g%d/%s">%s كل المواد</button>
      <span class="view-head__icon" aria-hidden="true">%s</span>
      <div class="view-head__text">
        <h2>%s — %s</h2>
        <p>%s · %s</p>
      </div>
    </div>
    <div class="grid grid--exams">
%s    </div>
  </section>
""" % (
        grade,
        sem_key,
        key,
        e(grade_name(grade)),
        e(sem_label),
        e(subject_label(key)),
        e(grade_name(grade)),
        e(sem_label),
        e(subject_label(key)),
        sem_key,
        hue,
        grade,
        sem_key,
        icon("#s-chev", "ic-back"),
        icon(subject_icon(key)),
        subject_label(key),
        grade_name(grade),
        sem_label,
        count_exams(len(items)),
        "".join(cards),
    )


def count_semesters(n):
    if n == 1:
        return "فصل واحد"
    if n == 2:
        return "فصلان دراسيان"
    return "%s فصول دراسية" % num(n)


def build_stats(exams):
    subjects_used = len({exam["subject"] for exam in exams})
    grades_used = len({exam["grade"] for exam in exams})
    return (
        '<li><b>%s</b> صفًّا دراسيًا</li>'
        '<li><b>%s</b> مادة</li>'
        '<li><b>%s</b> اختبارًا منشورًا</li>'
        % (num(grades_used), num(subjects_used), num(len(exams)))
    )


def build_content(exams):
    exams_by_cell = {}
    for exam in exams:
        exams_by_cell.setdefault(
            (exam["grade"], exam["semester_key"], exam["subject"]), []
        ).append(exam)

    parts = [build_home(exams_by_cell)]
    for grade in range(GRADE_MIN, GRADE_MAX + 1):
        parts.append(build_grade_view(grade, exams_by_cell))
        for sem_row in SEMESTERS:
            parts.append(build_semester_view(grade, sem_row, exams_by_cell))
            for key, _, _, _, _ in subjects_for_grade(grade):
                items = exams_by_cell.get((grade, sem_row[0], key), [])
                if items:
                    parts.append(build_exams_view(grade, sem_row, key, items))
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


def copy_fonts(site_dir):
    """ينسخ ملفات خط Cairo المحلية إلى _site/fonts/ لتعمل المنصة بلا طلبات خارجية."""
    fonts_src = FONTS_DIR
    if not os.path.isdir(fonts_src):
        fonts_src = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
    if not os.path.isdir(fonts_src):
        raise SystemExit("مجلد الخطوط غير موجود: %s" % fonts_src)
    fonts_dst = os.path.join(site_dir, "fonts")
    os.makedirs(fonts_dst, exist_ok=True)
    for name in sorted(os.listdir(fonts_src)):
        src = os.path.join(fonts_src, name)
        if os.path.isfile(src):
            shutil.copyfile(src, os.path.join(fonts_dst, name))


def main(argv):
    site_dir = argv[1] if len(argv) > 1 else "_site"
    os.makedirs(site_dir, exist_ok=True)
    template_path = TEMPLATE_FILE
    if not os.path.isfile(template_path):
        template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "template.html")
    with open(template_path, "r", encoding="utf-8") as fh:
        template = fh.read()

    exams = collect_exams(site_dir)
    warn_hidden_exams(exams)
    copy_fonts(site_dir)

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
    # شفافية الفصل الدراسي: كم اختبارًا في كل فصل، وكم أُسند افتراضيًا للفصل الأول.
    if exams:
        by_semester = []
        for sem_row in SEMESTERS:
            count = len([exam for exam in exams if exam["semester"] == sem_row[1]])
            by_semester.append("%s: %d" % (sem_row[2], count))
        print("Semesters — %s" % ", ".join(by_semester))
        defaulted = len([exam for exam in exams if exam["semester_source"] == "default"])
        if defaulted:
            print(
                "Semester default — %d exam(s) had no explicit semester, "
                "assigned to %s (SEMESTER_DEFAULT)." % (defaulted, semester_name(SEMESTER_DEFAULT))
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
