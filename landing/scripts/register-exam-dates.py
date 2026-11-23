#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تسجيل تاريخ إضافة الاختبار الجديد (addedAt) بصيغة DD-MM-YYYY في landing/exams.json.

الاستخدام:
    python3 landing/scripts/register-exam-dates.py --exam <folder-name> [--date DD-MM-YYYY]
    python3 landing/scripts/register-exam-dates.py --from-git

ملاحظات:
  - لا يغيّر هذا السكربت أي تاريخ addedAt مسجّل مسبقًا.
  - لا يخترع تواريخ للاختبارات القديمة التي لا تملك addedAt أو سجل Git واضح.
"""

import argparse
import datetime
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
EXAMS_JSON = os.path.join(ROOT, "landing", "exams.json")
DATE_RE = re.compile(r"^\d{2}-\d{2}-\d{4}$")


def git_first_added_date(folder):
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
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0 or not proc.stdout.strip():
        return ""
    sha, date_str = proc.stdout.strip().splitlines()[0].split("\t", 1)
    parent = subprocess.run(
        ["git", "rev-parse", "--verify", "--quiet", sha + "^"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if parent.returncode != 0:
        return ""
    return date_str if DATE_RE.match(date_str) else ""


def main(argv=None):
    parser = argparse.ArgumentParser(description="Register addedAt date in landing/exams.json")
    parser.add_argument("--exam", action="append", default=[], help="Folder name of newly added exam")
    parser.add_argument("--date", default="", help="Fixed date DD-MM-YYYY (defaults to UTC today)")
    parser.add_argument("--from-git", action="store_true", help="Populate missing addedAt from non-shallow git history")
    args = parser.parse_args(argv)

    with open(EXAMS_JSON, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    overrides = data.setdefault("overrides", {})

    target_date = args.date.strip() or datetime.datetime.now(datetime.timezone.utc).strftime("%d-%m-%Y")
    if not DATE_RE.match(target_date):
        print("Error: --date must be DD-MM-YYYY", file=sys.stderr)
        return 1

    changed = False
    for folder in args.exam:
        entry = overrides.setdefault(folder, {})
        if not entry.get("addedAt"):
            entry["addedAt"] = git_first_added_date(folder) or target_date
            changed = True
            print(f"Registered {folder}: addedAt={entry['addedAt']}")
        else:
            print(f"Kept existing {folder}: addedAt={entry['addedAt']}")

    if args.from_git:
        for folder in sorted(overrides):
            entry = overrides[folder]
            if entry.get("addedAt"):
                continue
            d = git_first_added_date(folder)
            if d:
                entry["addedAt"] = d
                changed = True
                print(f"Git-detected {folder}: addedAt={d}")

    if changed:
        with open(EXAMS_JSON, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
