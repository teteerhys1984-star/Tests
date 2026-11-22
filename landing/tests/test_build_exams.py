#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""اختبارات منطق اكتشاف وبناء الاختبارات واستثناء مجلدات المصدر
في كلٍّ من .github/workflows/deploy.yml و landing/scripts/build-exams.sh.

تشغيل:
    python3 landing/tests/test_build_exams.py
"""

import json
import os
import re
import shutil
import stat
import subprocess
import tempfile
import textwrap
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DEPLOY_YML = os.path.join(ROOT, ".github", "workflows", "deploy.yml")
BUILD_EXAMS_SH = os.path.join(ROOT, "landing", "scripts", "build-exams.sh")

EXCLUDED_SOURCE_DIRS = (
    "grade-4-english-curriculum-exam-L1-5-A",
    "English Curriculum Lessons 3&4",
    "English_L1L2 Test",
    # Source upload of the Grade 3 English exam; published as
    # grade3-english-curriculum-exam-l1-5-a instead (never built on its own).
    "grade-3-english-curriculum-exam-L1-5-A",
    # Source upload of Grade 3 English exam Version B; published as
    # grade3-english-curriculum-exam-l1-5-b instead (never built on its own).
    "grade-3-english-curriculum-exam-L1-5-B",
    # Source upload of Grade 4 English exam Version B; published as
    # grade4-english-curriculum-exam-l1-5-b instead (never built on its own).
    "grade-4-english-curriculum-exam-L1-5-B",
    # Source upload of the Grade 5 English exam Version A; published as
    # grade5-english-curriculum-exam-l1-5-a instead (never built on its own).
    "grade-5-english-curriculum-exam-L1-5-A",
    # Source upload of the Grade 5 English exam Version B; published as
    # grade5-english-curriculum-exam-l1-5-b instead (never built on its own).
    "grade-5-english-curriculum-exam-L1-5-B",
    # Source upload of the Grade 5 English exam L1-5 (25Q) A; published as
    # grade5-english-curriculum-exam-l1-5-25q-a instead (never built on its own).
    "grade-5-english-curriculum-exam-L1-5 (25Q) A",
    "interactive-grade-8-english-exam-L1-3 A",
    "interactive-grade-8-english-exam-L1-3 B",
    # Source upload of the Grade 8 Science exam; published as
    # grade-8-science-test-model-a instead (never built on its own).
    "grade-8-science-test-model-A",
    # Source upload of the Grade 5 Math Unit 1 exam (21-11); published as
    # grade-5-math-test-unit1-21-11 instead (never built on its own).
    "grade-5-math-test-Unit1 21-11",
    # Source upload of the Grade 5 Math Unit 1 exam (21-11) Model B; published as
    # grade-5-math-test-unit1-21-11-model-b instead (never built on its own).
    "grade-5-math-test-Unit1 21-11 Model B",
    # The pre-existing Grade 3 foundation source exclusion in the deploy scripts.
    "english-foundation-test-22-11-26MI",
    # Source upload of the Grade 4 English foundation exam; published as
    # grade-4-english-foundation-test-22-11-26m instead (never built on its own).
    "English--foundation-test-22-11-26M",
    # Source upload of the Grade 7 physics exam (Model B, lessons 1&2); published
    # as grade-7-physics-test-l1-l2-model-b-24-11-26 instead (never built on its own).
    "interactive-physics-Test-L1&2-model-B-24-11-26",
)


def extract_deploy_build_script():
    """يستخرج نص خطوة البناء الفعلي من .github/workflows/deploy.yml كما سيعمل في CI."""
    with open(DEPLOY_YML, "r", encoding="utf-8") as fh:
        content = fh.read()
    pattern = re.compile(
        r"- name: Detect exam projects, build them, and assemble _site\n"
        r"\s+shell: bash\n"
        r"\s+run: \|\n"
        r"((?: {10}.*\n|\n)+)"
    )
    match = pattern.search(content)
    if not match:
        raise AssertionError("Could not extract exam build step from deploy.yml")
    return textwrap.dedent(match.group(1))


def make_stub_npm(bin_dir):
    """ينشئ أمر npm وهميًا للاختبارات السريعة المعزولة دون اتصال بالشبكة.

    إن احتوى package.json على حقل "__fail_if_invoked": true يفشل البناء فورًا،
    مما يثبت أن مجلدات المصدر المستثناة لم يُستدعَ داخلها npm أصلًا.
    """
    os.makedirs(bin_dir, exist_ok=True)
    npm_path = os.path.join(bin_dir, "npm")
    script = """#!/usr/bin/env python3
import json, os, sys

with open("package.json", "r", encoding="utf-8") as fh:
    pkg = json.load(fh)

if pkg.get("__fail_if_invoked"):
    sys.stderr.write("ERROR: npm invoked inside excluded folder: %s\\n" % os.getcwd())
    sys.exit(1)

args = sys.argv[1:]
if args == ["ci"]:
    sys.exit(0)
if args == ["run", "build"]:
    os.makedirs("dist", exist_ok=True)
    title = pkg.get("__title", os.path.basename(os.getcwd()))
    exam_id = os.path.basename(os.getcwd())
    with open(os.path.join("dist", "index.html"), "w", encoding="utf-8") as out:
        out.write(
            '<!doctype html><html lang="ar" dir="rtl"><head><title>%s</title></head>'
            '<body><script>const EXAM_ID = "%s";</script></body></html>'
            % (title, exam_id)
        )
    sys.exit(0)

sys.stderr.write("Unexpected npm args: %r\\n" % (args,))
sys.exit(2)
"""
    with open(npm_path, "w", encoding="utf-8") as fh:
        fh.write(script)
    os.chmod(npm_path, os.stat(npm_path).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    return bin_dir


class BuildExclusionLogic(unittest.TestCase):
    """يتحقق من استثناء مجلدات المصدر واكتشاف الاختبارات الفعلية."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="build-exams-test-")
        self.bin_dir = make_stub_npm(os.path.join(self.tmp, "_bin"))
        self.env = os.environ.copy()
        self.env["PATH"] = self.bin_dir + os.pathsep + self.env.get("PATH", "")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_bash_syntax_is_valid_in_deploy_yml_and_build_script(self):
        deploy_script = extract_deploy_build_script()
        proc1 = subprocess.run(
            ["bash", "-n"],
            input=deploy_script,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(proc1.returncode, 0, proc1.stderr)

        proc2 = subprocess.run(
            ["bash", "-n", BUILD_EXAMS_SH],
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(proc2.returncode, 0, proc2.stderr)

    def _populate_fixture_workspace(self, ws):
        os.makedirs(ws, exist_ok=True)
        # مجلدا المصدر يحتويان package.json ومضبوطان على الفشل الفوري لو تم استدعاء npm داخلهما
        for src_dir in EXCLUDED_SOURCE_DIRS:
            folder = os.path.join(ws, src_dir)
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, "package.json"), "w", encoding="utf-8") as fh:
                json.dump({"name": "source-prototype", "__fail_if_invoked": True}, fh)

        # مجلدات مخفية أو إدارية أو مصدرية بلا package.json
        for hidden_or_meta in (".github", "landing"):
            folder = os.path.join(ws, hidden_or_meta)
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, "package.json"), "w", encoding="utf-8") as fh:
                json.dump({"name": "trap", "__fail_if_invoked": True}, fh)

        for non_pkg in ("english-foundation-assessment-development", "temp-physics-grade8-l1l2"):
            folder = os.path.join(ws, non_pkg)
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, "index.html"), "w", encoding="utf-8") as fh:
                fh.write("<html>raw source</html>")

        # اختبارات فعلية يجب بناؤها ونشرها في _site
        exams = {
            "grade8-english-curriculum-l3-l4": "English Curriculum Lessons 3&4 — Grade 8",
            "grade8-english-curriculum-l1-l2": "Curriculum Lesson 1 & 2 — Grade 8",
            "grade5-arabic-exam": "اختبار اللغة العربية — الصف الخامس",
        }
        for folder_name, title in exams.items():
            folder = os.path.join(ws, folder_name)
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, "package.json"), "w", encoding="utf-8") as fh:
                json.dump({"name": folder_name, "__title": title}, fh)
        return exams

    def test_deploy_yml_script_skips_source_folders_and_builds_actual_exams(self):
        ws = os.path.join(self.tmp, "ws-deploy")
        expected_exams = self._populate_fixture_workspace(ws)
        script = extract_deploy_build_script()

        proc = subprocess.run(
            ["bash", "-c", script],
            cwd=ws,
            env=self.env,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr + "\n" + proc.stdout)

        site_dir = os.path.join(ws, "_site")
        published = sorted(os.listdir(site_dir))
        self.assertEqual(published, sorted(expected_exams.keys()))
        for src_dir in EXCLUDED_SOURCE_DIRS:
            self.assertNotIn(src_dir, published)
            self.assertIn(f"Skipping source folder (not a standalone exam): {src_dir}", proc.stdout)
        for exam_name in expected_exams:
            self.assertTrue(os.path.isfile(os.path.join(site_dir, exam_name, "index.html")))

    def test_build_exams_sh_matches_deploy_yml_behavior(self):
        ws = os.path.join(self.tmp, "ws-script")
        expected_exams = self._populate_fixture_workspace(ws)
        scripts_dir = os.path.join(ws, "landing", "scripts")
        os.makedirs(scripts_dir, exist_ok=True)
        copied_script = os.path.join(scripts_dir, "build-exams.sh")
        shutil.copy2(BUILD_EXAMS_SH, copied_script)

        proc = subprocess.run(
            ["bash", copied_script],
            cwd=ws,
            env=self.env,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr + "\n" + proc.stdout)

        site_dir = os.path.join(ws, "_site")
        published = sorted(os.listdir(site_dir))
        self.assertEqual(published, sorted(expected_exams.keys()))
        for src_dir in EXCLUDED_SOURCE_DIRS:
            self.assertNotIn(src_dir, published)

    def test_real_repository_folder_discovery_parity(self):
        """يطبق منطق deploy.yml و build-exams.sh على جميع مجلدات جذر المستودع الفعلية."""
        actual_exams = sorted(
            name
            for name in os.listdir(ROOT)
            if os.path.isdir(os.path.join(ROOT, name))
            and not name.startswith(".")
            and name not in ("landing", "_site")
            and name not in EXCLUDED_SOURCE_DIRS
            and os.path.isfile(os.path.join(ROOT, name, "package.json"))
        )
        self.assertIn("grade8-english-curriculum-l3-l4", actual_exams)
        self.assertIn("grade8-english-curriculum-l1-l2", actual_exams)
        self.assertIn("grade3-english-curriculum-exam-l1-5-a", actual_exams)
        self.assertIn("grade3-english-curriculum-exam-l1-5-b", actual_exams)
        self.assertIn("grade4-english-curriculum-exam-l1-5-a", actual_exams)
        self.assertIn("grade4-english-curriculum-exam-l1-5-b", actual_exams)
        self.assertIn("grade5-english-curriculum-exam-l1-5-a", actual_exams)
        self.assertIn("grade5-english-curriculum-exam-l1-5-b", actual_exams)
        self.assertIn("grade5-english-curriculum-exam-l1-5-25q-a", actual_exams)
        self.assertIn("interactive-grade-8-english-exam-l1-3-a", actual_exams)
        self.assertIn("interactive-grade-8-english-exam-l1-3-b", actual_exams)
        self.assertGreaterEqual(len(actual_exams), 31)

        ws = os.path.join(self.tmp, "ws-real-mirror")
        os.makedirs(ws, exist_ok=True)
        for name in os.listdir(ROOT):
            full = os.path.join(ROOT, name)
            if not os.path.isdir(full) or name in (".git", "_site", "node_modules"):
                continue
            dst = os.path.join(ws, name)
            os.makedirs(dst, exist_ok=True)
            if os.path.isfile(os.path.join(full, "package.json")):
                fail = name in EXCLUDED_SOURCE_DIRS
                with open(os.path.join(dst, "package.json"), "w", encoding="utf-8") as fh:
                    json.dump({"name": name, "__fail_if_invoked": fail}, fh)

        script = extract_deploy_build_script()
        proc = subprocess.run(
            ["bash", "-c", script],
            cwd=ws,
            env=self.env,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr + "\n" + proc.stdout)
        published = sorted(os.listdir(os.path.join(ws, "_site")))
        self.assertEqual(published, actual_exams)
        for src_dir in EXCLUDED_SOURCE_DIRS:
            self.assertNotIn(src_dir, published)

    def test_source_folders_remain_intact_and_unmodified(self):
        """يتأكد من عدم حذف مجلدات المصدر أو تلفيق ملفات صوتية داخلها."""
        l3l4_src = os.path.join(ROOT, "English Curriculum Lessons 3&4")
        l1l2_src = os.path.join(ROOT, "English_L1L2 Test")
        self.assertTrue(os.path.isdir(l3l4_src))
        self.assertTrue(os.path.isfile(os.path.join(l3l4_src, "package.json")))
        self.assertTrue(os.path.isfile(os.path.join(l3l4_src, "src", "lib", "audio.ts")))
        self.assertFalse(
            os.path.exists(os.path.join(l3l4_src, "src", "assets", "audio", "submit.wav")),
            "Must not fabricate submit.wav inside English Curriculum Lessons 3&4",
        )
        self.assertTrue(os.path.isdir(l1l2_src))
        self.assertTrue(os.path.isfile(os.path.join(l1l2_src, "package.json")))
        g3b_src = os.path.join(ROOT, "grade-3-english-curriculum-exam-L1-5-B")
        self.assertTrue(os.path.isdir(g3b_src))
        self.assertTrue(os.path.isfile(os.path.join(g3b_src, "package.json")))
        g4b_src = os.path.join(ROOT, "grade-4-english-curriculum-exam-L1-5-B")
        self.assertTrue(os.path.isdir(g4b_src))
        self.assertTrue(os.path.isfile(os.path.join(g4b_src, "package.json")))
        self.assertTrue(os.path.isfile(os.path.join(g4b_src, "src", "data", "questions.ts")))
        g5a_src = os.path.join(ROOT, "grade-5-english-curriculum-exam-L1-5-A")
        self.assertTrue(os.path.isdir(g5a_src))
        self.assertTrue(os.path.isfile(os.path.join(g5a_src, "package.json")))
        self.assertTrue(os.path.isfile(os.path.join(g5a_src, "src", "data", "exam.ts")))
        g5_25q_src = os.path.join(ROOT, "grade-5-english-curriculum-exam-L1-5 (25Q) A")
        self.assertTrue(os.path.isdir(g5_25q_src))
        self.assertTrue(os.path.isfile(os.path.join(g5_25q_src, "package.json")))
        self.assertTrue(os.path.isfile(os.path.join(g5_25q_src, "src", "data", "exam.ts")))
        g8_l13b_src = os.path.join(ROOT, "interactive-grade-8-english-exam-L1-3 B")
        self.assertTrue(os.path.isdir(g8_l13b_src))
        self.assertTrue(os.path.isfile(os.path.join(g8_l13b_src, "package.json")))
        self.assertTrue(os.path.isfile(os.path.join(g8_l13b_src, "src", "data", "exam.ts")))


class RealBuiltSiteExclusion(unittest.TestCase):
    """يتحقق من الموقع المبني فعليًا (_site) عند توفره."""

    def test_excluded_source_folders_are_absent_from_built_site_and_links(self):
        site_dir = os.path.join(ROOT, "_site")
        index_html = os.path.join(site_dir, "index.html")
        if not os.path.isfile(index_html):
            self.skipTest("no _site/index.html — run build & generate first")

        for src_dir in EXCLUDED_SOURCE_DIRS:
            self.assertFalse(
                os.path.exists(os.path.join(site_dir, src_dir)),
                f"Source folder must not be built into _site: {src_dir}",
            )

        for real_exam in (
            "grade8-english-curriculum-l3-l4",
            "grade8-english-curriculum-l1-l2",
            "grade3-english-curriculum-exam-l1-5-a",
            "grade3-english-curriculum-exam-l1-5-b",
            "grade4-english-curriculum-exam-l1-5-a",
            "grade4-english-curriculum-exam-l1-5-b",
            "grade5-english-curriculum-exam-l1-5-a",
            "grade5-english-curriculum-exam-l1-5-b",
            "grade5-english-curriculum-exam-l1-5-25q-a",
            "interactive-grade-8-english-exam-l1-3-a",
            "interactive-grade-8-english-exam-l1-3-b",
        ):
            self.assertTrue(
                os.path.isfile(os.path.join(site_dir, real_exam, "index.html")),
                f"Actual exam missing from _site: {real_exam}",
            )

        with open(index_html, "r", encoding="utf-8") as fh:
            page = fh.read()

        hrefs = set(re.findall(r'href="\./([^"/]+)/"', page))
        self.assertIn("grade8-english-curriculum-l3-l4", hrefs)
        self.assertIn("grade8-english-curriculum-l1-l2", hrefs)
        self.assertIn("grade3-english-curriculum-exam-l1-5-a", hrefs)
        self.assertIn("grade3-english-curriculum-exam-l1-5-b", hrefs)
        self.assertIn("grade4-english-curriculum-exam-l1-5-a", hrefs)
        self.assertIn("grade4-english-curriculum-exam-l1-5-b", hrefs)
        self.assertIn("grade5-english-curriculum-exam-l1-5-a", hrefs)
        self.assertIn("grade5-english-curriculum-exam-l1-5-b", hrefs)
        self.assertIn("grade5-english-curriculum-exam-l1-5-25q-a", hrefs)
        self.assertIn("interactive-grade-8-english-exam-l1-3-a", hrefs)
        self.assertIn("interactive-grade-8-english-exam-l1-3-b", hrefs)
        self.assertIn("Grade 3 English Curriculum Exam L1-5 A", page)
        self.assertIn("Grade 3 English Curriculum Exam L1-5 B", page)
        self.assertIn("Grade 4 English Curriculum Exam L1-5 A", page)
        self.assertIn("Grade 4 English Curriculum Exam L1-5 B", page)
        self.assertIn("Grade 5 English Curriculum Exam L1-5 A", page)
        self.assertIn("Grade 5 English Curriculum Exam L1-5 B", page)
        self.assertIn("Grade 5 English Curriculum Exam L1-5 (25Q) A", page)
        self.assertIn("Interactive Grade 8 English Exam L1-3 A", page)
        self.assertIn("Interactive Grade 8 English Exam L1-3 B", page)
        for forbidden_href in (
            "English Curriculum Lessons 3&4",
            "English%20Curriculum%20Lessons%203%264",
            "English%20Curriculum%20Lessons%203&amp;4",
            "English_L1L2 Test",
            "English_L1L2%20Test",
            "grade-3-english-curriculum-exam-L1-5-A",
            "grade-3-english-curriculum-exam-L1-5-B",
            "grade-4-english-curriculum-exam-L1-5-A",
            "grade-4-english-curriculum-exam-L1-5-B",
            "grade-5-english-curriculum-exam-L1-5-A",
            "grade-5-english-curriculum-exam-L1-5-B",
            "grade-5-english-curriculum-exam-L1-5 (25Q) A",
            "interactive-grade-8-english-exam-L1-3 A",
            "interactive-grade-8-english-exam-L1-3 B",
            "interactive-grade-8-english-exam-L1-3%20A",
            "interactive-grade-8-english-exam-L1-3%20B",
            "grade-5-english-curriculum-exam-L1-5%20(25Q)%20A",
        ):
            self.assertNotIn(forbidden_href, hrefs)


if __name__ == "__main__":
    unittest.main(verbosity=2)
