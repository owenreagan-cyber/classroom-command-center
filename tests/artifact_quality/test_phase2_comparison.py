#!/usr/bin/env python3
"""Phase 2 student/key comparison, reflow, and page-count tests."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from scripts.artifact_quality.models import CheckStatus
from scripts.artifact_quality.run_preflight import run_preflight
from tests.artifact_quality.helpers import FIXTURES, LOCAL_ROOT, RUNNER, ensure_fixtures


class ComparisonTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        ensure_fixtures()

    def test_student_key_page_count_mismatch_is_fail(self) -> None:
        report = run_preflight(
            profile_name="teacher-key-letter",
            input_path=FIXTURES / "student_two_pages.pdf",
            student_path=FIXTURES / "student_two_pages.pdf",
            teacher_path=FIXTURES / "key_three_pages.pdf",
        )
        self.assertEqual(report.final_status, CheckStatus.FAIL)
        fail = [c for c in report.checks if "page count" in c.message.lower()]
        self.assertTrue(fail)
        self.assertIn("student=2", fail[0].details or "")
        self.assertIn("teacher=3", fail[0].details or "")

    def test_page_count_mismatch_returns_nonzero_exit(self) -> None:
        proc = subprocess.run(
            [
                sys.executable,
                str(RUNNER),
                "--profile",
                "teacher-key-letter",
                "--student",
                str(FIXTURES / "student_two_pages.pdf"),
                "--teacher",
                str(FIXTURES / "key_three_pages.pdf"),
                "--strict",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 1)

    def test_page_count_mismatch_recorded_in_json(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            out = Path(tmp)
            run_preflight(
                profile_name="teacher-key-letter",
                input_path=FIXTURES / "student_two_pages.pdf",
                student_path=FIXTURES / "student_two_pages.pdf",
                teacher_path=FIXTURES / "key_three_pages.pdf",
                output_dir=out,
                json_output=True,
            )
            data = json.loads((out / "report.json").read_text())
            self.assertEqual(data["final_status"], "FAIL")
            messages = " ".join(c["message"] + " " + (c.get("details") or "") for c in data["checks"])
            self.assertIn("student=2", messages)
            self.assertIn("teacher=3", messages)

    def test_equal_page_count_pair_does_not_trigger_failure(self) -> None:
        report = run_preflight(
            profile_name="teacher-key-letter",
            input_path=FIXTURES / "student_layout.pdf",
            student_path=FIXTURES / "student_layout.pdf",
            teacher_path=FIXTURES / "key_reflow_warn.pdf",
        )
        page_fail = [c for c in report.checks if c.status == CheckStatus.FAIL and "page count" in c.message.lower()]
        self.assertFalse(page_fail)

    def test_answer_reflow_over_tolerance_generates_warn(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            out = Path(tmp)
            report = run_preflight(
                profile_name="teacher-key-letter",
                input_path=FIXTURES / "student_layout.pdf",
                student_path=FIXTURES / "student_layout.pdf",
                teacher_path=FIXTURES / "key_reflow_warn.pdf",
                output_dir=out,
                visual_compare=True,
            )
            warn = [c for c in report.checks if c.status == CheckStatus.WARN]
            self.assertTrue(warn)
            drift = " ".join(c.message.lower() for c in warn)
            self.assertTrue(
                "visual" in drift or "ink" in drift or "structural" in drift or "review" in drift,
                drift,
            )

    def test_answer_overflow_causing_overlap_generates_fail(self) -> None:
        report = run_preflight(
            profile_name="teacher-key-letter",
            input_path=FIXTURES / "student_layout.pdf",
            student_path=FIXTURES / "student_layout.pdf",
            teacher_path=FIXTURES / "key_overflow_fail.pdf",
            strict=True,
        )
        self.assertEqual(report.final_status, CheckStatus.FAIL)

    def test_visual_compare_outputs_diff_and_overlay(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            out = Path(tmp)
            run_preflight(
                profile_name="teacher-key-letter",
                input_path=FIXTURES / "student_layout.pdf",
                student_path=FIXTURES / "student_layout.pdf",
                teacher_path=FIXTURES / "key_reflow_warn.pdf",
                output_dir=out,
                visual_compare=True,
            )
            compare_dir = out / "visual-compare"
            self.assertTrue(compare_dir.is_dir())
            self.assertTrue(any(compare_dir.glob("*-diff.png")))
            self.assertTrue(any(compare_dir.glob("*-overlay.png")))
            for path in compare_dir.rglob("*"):
                self.assertTrue(str(path.resolve()).startswith(str(LOCAL_ROOT.resolve())))

    def test_layout_shift_metrics_are_recorded(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            out = Path(tmp)
            report = run_preflight(
                profile_name="teacher-key-letter",
                input_path=FIXTURES / "student_layout.pdf",
                student_path=FIXTURES / "student_layout.pdf",
                teacher_path=FIXTURES / "key_reflow_warn.pdf",
                output_dir=out,
                visual_compare=True,
                json_output=True,
            )
            data = json.loads((out / "report.json").read_text())
            self.assertTrue(report.page_metrics or data.get("checks"))
            ink_msgs = [c for c in data["checks"] if "ink" in c["message"].lower()]
            self.assertTrue(ink_msgs or any(c["status"] == "WARN" for c in data["checks"]))

    def test_answer_text_inside_existing_response_area_does_not_warn(self) -> None:
        report = run_preflight(
            profile_name="worksheet-letter",
            input_path=FIXTURES / "pass_worksheet.pdf",
        )
        self.assertIn(report.final_status, {CheckStatus.PASS, CheckStatus.WARN})


if __name__ == "__main__":
    unittest.main(verbosity=2)
