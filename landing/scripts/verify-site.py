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

ENGINEER = "المهندس سومر شاهين"
PHONE = "0930215022"
WHATSAPP_URL = "https://wa.me/963930215022"

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

    print("1) كل مجلد منشور له رابط في الصفحة الرئيسية")
    folders = sorted(
        name for name in os.listdir(site)
        if os.path.isfile(os.path.join(site, name, "index.html"))
    )
    for folder in folders:
        check('href="./%s/"' % folder in page, "%s ← له رابط" % folder)

    print("2) كل رابط في الصفحة الرئيسية يؤدي إلى صفحة منشورة")
    for href in sorted(set(re.findall(r'href="\./([^"/]+)/"', page))):
        target = os.path.join(site, href, "index.html")
        check(os.path.isfile(target), "./%s/ ← الصفحة موجودة" % href)

    print("3) سلامة الاختبارات (EXAM_ID مطابق لاسم المجلد)")
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

    print("4) قاعدة ظهور المواد")
    for grade in range(1, 10):
        view = re.search(r'id="view-grade-%d".*?</section>' % grade, page, re.S)
        shown = re.findall(r'data-subject="([a-z]+)"', view.group(0)) if view else []
        for subject, allowed in SUBJECT_GRADES.items():
            should = grade in allowed
            check((subject in shown) == should,
                  "الصف %s: %s %s" % (GRADE_WORDS[grade], SUBJECT_NAMES[subject],
                                      "تظهر" if should else "لا تظهر"))

    print("5) استقلالية الصفحة (لا موارد خارجية)")
    externals = [u for u in re.findall(r'(?:src|href)="(https?://[^"]+)"', page)
                 if u != WHATSAPP_URL]  # رابط واتساب رابط تنقّل، لا مورد يُحمَّل
    check(not externals, "لا طلبات خارجية (%d)" % len(externals))
    resources = re.findall(r'<(?:script|img|link|iframe)\b[^>]*(?:src|href)="https?://', page)
    check(not resources and "@import" not in page and "url(http" not in page,
          "لا سكربتات أو صور أو خطوط من الإنترنت")
    check('dir="rtl"' in page and 'lang="ar"' in page, "اتجاه RTL ولغة عربية")
    check("<details" not in page and "<select" not in page,
          "لا قوائم منسدلة ولا أكورديون")

    print("6) الأرقام إنجليزية في كل الواجهة")
    eastern = sorted(set(re.findall("[\u0660-\u0669\u06f0-\u06f9]", page)))
    check(not eastern, "لا أرقام عربية-هندية في الصفحة (%s)" % ("".join(eastern) or "0"))
    for grade in range(1, 10):
        check(re.search(r'class="grade-card__num"[^>]*>%d<' % grade, page) is not None,
              "بطاقة الصف تعرض الرقم %d" % grade)

    print("7) بيانات المهندس ورابط واتساب")
    check(page.count(ENGINEER) == 2, "«%s» يظهر مرتين: أعلى الصفحة وأسفلها" % ENGINEER)
    links = re.findall(r'<a\b[^>]*href="(https://wa\.me/[^"]*)"', page)
    check(links == [WHATSAPP_URL, WHATSAPP_URL], "رابطا واتساب يفتحان %s" % WHATSAPP_URL)
    check(len(re.findall(r'class="wa__num">%s<' % PHONE, page)) == 2,
          "الرقم المعروض %s في الموضعين" % PHONE)
    check(page.count('href="#s-whatsapp"') == 2 and 'id="s-whatsapp"' in page,
          "شعار واتساب SVG محلي في الموضعين")
    check(page.index("</main>") < page.index('class="credit"'), "التذييل بعد المحتوى (غير عائم)")

    print("8) الطائرة المتحركة")
    check('class="sky" aria-hidden="true"' in page and 'class="flight"' in page,
          "طبقة السماء والطائرة موجودتان ومخفيّتان عن قارئ الشاشة")
    check(re.search(r"\.sky \{[^}]*pointer-events: none", page) is not None,
          "الطائرة لا تستقبل النقر ولا تحجب المحتوى")
    check(re.search(r"prefers-reduced-motion: reduce.*?\.sky \*[^{]*\{ animation: none !important",
                    page, re.S) is not None, "الحركة تتوقف مع prefers-reduced-motion")

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
