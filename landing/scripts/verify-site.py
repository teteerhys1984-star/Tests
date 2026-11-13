#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""التحقق من نتيجة النشر قبل رفعها: كل اختبار منشور، وكل رابط يعمل،
وقاعدة ظهور المواد مطبّقة.

    python3 landing/scripts/verify-site.py _site

يخرج بقيمة 0 إن كانت كل الفحوص ناجحة، و1 إن فشل أحدها.
"""

import os
import re
import sys

GRADE_WORDS = {
    1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس",
    6: "السادس", 7: "السابع", 8: "الثامن", 9: "التاسع",
}
SUBJECT_GRADES = {
    "arabic": range(1, 10), "math": range(1, 10), "english": range(1, 10),
    "physics": [7, 8, 9], "chemistry": [7, 8, 9],
}
SUBJECT_NAMES = {
    "arabic": "اللغة العربية", "math": "الرياضيات", "english": "اللغة الإنجليزية",
    "physics": "الفيزياء", "chemistry": "الكيمياء",
}

failures = []
checks = 0


def check(ok, message):
    global checks
    checks += 1
    print(("  ✓ " if ok else "  ✗ ") + message)
    if not ok:
        failures.append(message)


def main(argv):
    site = argv[1] if len(argv) > 1 else "_site"
    index_path = os.path.join(site, "index.html")
    if not os.path.isfile(index_path):
        print("✗ %s غير موجود — شغّل المولّد أولًا" % index_path)
        return 1
    page = open(index_path, "r", encoding="utf-8").read()

    print("١) كل مجلد منشور له رابط في الصفحة الرئيسية")
    folders = sorted(
        name for name in os.listdir(site)
        if os.path.isfile(os.path.join(site, name, "index.html"))
    )
    for folder in folders:
        check('href="./%s/"' % folder in page, "%s ← له رابط" % folder)

    print("٢) كل رابط في الصفحة الرئيسية يؤدي إلى صفحة منشورة")
    for href in sorted(set(re.findall(r'href="\./([^"/]+)/"', page))):
        target = os.path.join(site, href, "index.html")
        check(os.path.isfile(target), "./%s/ ← الصفحة موجودة" % href)

    print("٣) سلامة الاختبارات (EXAM_ID مطابق لاسم المجلد)")
    for folder in folders:
        content = open(os.path.join(site, folder, "index.html"), "r", encoding="utf-8",
                       errors="ignore").read()
        ids = set(re.findall(r'EXAM_ID\s*=\s*"([^"]+)"', content))
        if ids:
            # صفحة غير مضغوطة (build.mjs): يُقرأ المعرّف باسمه
            check(ids == {folder}, "%s ← EXAM_ID = %s" % (folder, ", ".join(sorted(ids))))
        else:
            # بناء مضغوط (vite): يُتحقق من وجود قيمة المعرّف نفسها في الصفحة
            check('"%s"' % folder in content, "%s ← قيمة EXAM_ID موجودة (بناء مضغوط)" % folder)

    print("٤) قاعدة ظهور المواد")
    for grade in range(1, 10):
        view = re.search(r'id="view-grade-%d".*?</section>' % grade, page, re.S)
        shown = re.findall(r'data-subject="([a-z]+)"', view.group(0)) if view else []
        for subject, allowed in SUBJECT_GRADES.items():
            should = grade in allowed
            check((subject in shown) == should,
                  "الصف %s: %s %s" % (GRADE_WORDS[grade], SUBJECT_NAMES[subject],
                                      "تظهر" if should else "لا تظهر"))

    print("٥) استقلالية الصفحة (لا موارد خارجية)")
    externals = [u for u in re.findall(r'(?:src|href)="(https?://[^"]+)"', page)]
    check(not externals, "لا طلبات خارجية (%d)" % len(externals))
    check('dir="rtl"' in page and 'lang="ar"' in page, "اتجاه RTL ولغة عربية")
    check("<details" not in page and "<select" not in page,
          "لا قوائم منسدلة ولا أكورديون")

    print()
    if failures:
        print("فشل %d من %d فحصًا:" % (len(failures), checks))
        for item in failures:
            print("  - " + item)
        return 1
    print("كل الفحوص ناجحة (%d) — الصفوف: %d، الاختبارات: %d"
          % (checks, 9, len(folders)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
