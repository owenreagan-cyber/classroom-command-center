#!/usr/bin/env python3
"""Phase 2 memory safety, output sandbox, git preservation, and exit-code tests."""
from __future__ import annotations

import gc
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from scripts.artifact_quality.models import CheckStatus
from scripts.artifact_quality.run_preflight import run_preflight
from tests.artifact_quality.helpers import (
    FIXTURES,
    LOCAL_ROOT,
    PHASE2_SUITE,
    PREFLIGHT_SUITE,
    REPO_ROOT,
    RUNNER,
    ensure_fixtures,
    file_sha256,
    resident_memory_mb,
)


class ResourceSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        ensure_fixtures()
        LOCAL_ROOT.mkdir(parents=True, exist_ok=True)

    def test_twenty_page_pdf_processes_with_bounded_memory(self) -> None:
        gc.collect()
        baseline = resident_memory_mb()
        path = FIXTURES / "twenty_page_mixed_content.pdf"
        report = run_preflight(profile_name="worksheet-letter", input_path=path, render=False)
        gc.collect()
        late = resident_memory_mb()
        growth = late - baseline
        self.assertGreaterEqual(len(report.page_metrics), 20)
        self.assertLess(growth, 150.0, f"memory growth {growth:.1f}MB baseline={baseline:.1f} late={late:.1f}")

    def test_pdf_handle_is_closed_after_preflight(self) -> None:
        import fitz

        path = FIXTURES / "pass_worksheet.pdf"
        report = run_preflight(profile_name="worksheet-letter", input_path=path)
        self.assertEqual(len(report.page_metrics), 1)
        doc = fitz.open(path)
        doc.close()

    def test_rendered_images_are_closed_after_each_page(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            out = Path(tmp)
            run_preflight(
                profile_name="worksheet-letter",
                input_path=FIXTURES / "twenty_page_mixed_content.pdf",
                output_dir=out,
                render=True,
            )
            renders = list((out / "renders").glob("*.png"))
            self.assertGreaterEqual(len(renders), 20)

    def test_source_pdf_can_be_removed_after_processing(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-src-", dir=LOCAL_ROOT) as tmp:
            src = Path(tmp) / "copy.pdf"
            shutil.copy(FIXTURES / "pass_worksheet.pdf", src)
            run_preflight(profile_name="worksheet-letter", input_path=src)
            removed = src.with_suffix(".removed.pdf")
            src.rename(removed)
            self.assertFalse(src.exists())
            removed.unlink()

    @unittest.skipUnless(sys.platform == "linux", "fd counting is linux-specific")
    def test_multi_page_preflight_does_not_exhaust_file_descriptors(self) -> None:
        gc.collect()
        try:
            soft, _ = os.getrlimit(os.RLIMIT_NOFILE)  # type: ignore[attr-defined]
        except (AttributeError, ValueError):
            soft = 256
        before = len(os.listdir("/dev/fd")) if Path("/dev/fd").exists() else 0
        run_preflight(
            profile_name="worksheet-letter",
            input_path=FIXTURES / "twenty_page_mixed_content.pdf",
            render=True,
            output_dir=LOCAL_ROOT / "fd-check",
        )
        after = len(os.listdir("/dev/fd")) if Path("/dev/fd").exists() else 0
        self.assertLess(after - before, max(soft // 4, 50))


class OutputSandboxTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        ensure_fixtures()
        LOCAL_ROOT.mkdir(parents=True, exist_ok=True)

    def _run_cli(self, *extra: str) -> subprocess.CompletedProcess[str]:
        cmd = [
            sys.executable,
            str(RUNNER),
            "--profile",
            "worksheet-letter",
            "--input",
            str(FIXTURES / "pass_worksheet.pdf"),
            *extra,
        ]
        return subprocess.run(cmd, capture_output=True, text=True, check=False, cwd=REPO_ROOT)

    def test_render_outputs_stay_inside_local_artifact_quality(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            out = Path(tmp)
            run_preflight(
                profile_name="worksheet-letter",
                input_path=FIXTURES / "pass_worksheet.pdf",
                output_dir=out,
                render=True,
            )
            for path in out.rglob("*"):
                if path.is_file():
                    self.assertTrue(str(path.resolve()).startswith(str(LOCAL_ROOT.resolve())))

    def test_annotation_outputs_stay_inside_sandbox(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            out = Path(tmp)
            run_preflight(
                profile_name="worksheet-letter",
                input_path=FIXTURES / "pass_worksheet.pdf",
                output_dir=out,
                render=True,
                annotate=True,
            )
            self.assertTrue(any((out / "annotated").glob("*.png")))

    def test_contact_sheet_stays_inside_sandbox(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            out = Path(tmp)
            run_preflight(
                profile_name="worksheet-letter",
                input_path=FIXTURES / "pass_worksheet.pdf",
                output_dir=out,
                render=True,
                contact_sheet=True,
            )
            self.assertTrue((out / "preview-contact-sheet.png").is_file())

    def test_visual_compare_stays_inside_sandbox(self) -> None:
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
            self.assertTrue((out / "visual-compare").is_dir())

    def test_source_pdf_hash_unchanged(self) -> None:
        path = FIXTURES / "pass_worksheet.pdf"
        before = file_sha256(path)
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            run_preflight(
                profile_name="worksheet-letter",
                input_path=path,
                output_dir=Path(tmp),
                render=True,
                annotate=True,
                json_output=True,
            )
        self.assertEqual(file_sha256(path), before)

    def test_source_directory_remains_clean(self) -> None:
        before = set(FIXTURES.glob("*"))
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            run_preflight(
                profile_name="worksheet-letter",
                input_path=FIXTURES / "pass_worksheet.pdf",
                output_dir=Path(tmp),
                render=True,
            )
        after = set(FIXTURES.glob("*"))
        self.assertEqual(before, after)

    def test_path_traversal_output_is_rejected(self) -> None:
        proc = self._run_cli("--output-dir", str(REPO_ROOT / "tmp-artifact-escape"))
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("Output path must be under", proc.stderr + proc.stdout)

    def test_symlink_escape_is_rejected(self) -> None:
        escape = REPO_ROOT / ".local" / "artifact-quality" / "symlink-escape-test"
        escape.mkdir(parents=True, exist_ok=True)
        link = escape / "outside"
        target = REPO_ROOT / "node_modules"
        if link.exists() or link.is_symlink():
            link.unlink()
        link.symlink_to(target, target_is_directory=True)
        proc = self._run_cli("--output-dir", str(link))
        self.assertNotEqual(proc.returncode, 0)
        link.unlink()


class ExitCodeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        ensure_fixtures()

    def _cli(self, *args: str) -> int:
        proc = subprocess.run(
            [sys.executable, str(RUNNER), *args],
            capture_output=True,
            text=True,
            check=False,
            cwd=REPO_ROOT,
        )
        return proc.returncode

    def test_pass_fixture_returns_zero(self) -> None:
        code = self._cli(
            "--profile", "worksheet-letter",
            "--input", str(FIXTURES / "pass_worksheet.pdf"),
        )
        self.assertEqual(code, 0)

    def test_warn_fixture_returns_expected_normal_mode_code(self) -> None:
        code = self._cli(
            "--profile", "worksheet-letter",
            "--input", str(FIXTURES / "warn_whitespace.pdf"),
        )
        self.assertEqual(code, 0)

    def test_warn_fixture_strict_mode_behavior(self) -> None:
        code = self._cli(
            "--profile", "worksheet-letter",
            "--input", str(FIXTURES / "warn_whitespace.pdf"),
            "--strict",
        )
        self.assertEqual(code, 2)

    def test_fail_fixture_returns_nonzero(self) -> None:
        code = self._cli(
            "--profile", "worksheet-letter",
            "--input", str(FIXTURES / "fail_clipping.pdf"),
            "--strict",
        )
        self.assertEqual(code, 1)

    def test_missing_pdf_returns_nonzero(self) -> None:
        code = self._cli(
            "--profile", "worksheet-letter",
            "--input", str(FIXTURES / "does-not-exist.pdf"),
        )
        self.assertEqual(code, 1)

    def test_invalid_profile_key_returns_nonzero(self) -> None:
        proc = subprocess.run(
            [sys.executable, str(RUNNER), "--profile", "nonexistent-profile", "--input", str(FIXTURES / "pass_worksheet.pdf")],
            capture_output=True,
            text=True,
            check=False,
            cwd=REPO_ROOT,
        )
        self.assertNotEqual(proc.returncode, 0)

    def test_unsafe_output_path_returns_nonzero(self) -> None:
        code = self._cli(
            "--profile", "worksheet-letter",
            "--input", str(FIXTURES / "pass_worksheet.pdf"),
            "--output-dir", str(REPO_ROOT),
        )
        self.assertEqual(code, 1)


class GitPreservationTests(unittest.TestCase):
    def _git(self, *args: str) -> str:
        proc = subprocess.run(
            ["git", *args],
            capture_output=True,
            text=True,
            check=False,
            cwd=REPO_ROOT,
        )
        return proc.stdout.strip()

    def setUp(self) -> None:
        if os.environ.get("ARTIFACT_QUALITY_INSIDE_PHASE2_SUITE") == "1":
            self.skipTest("Git integration runs from artifact-quality-phase2-suite.sh")

    @unittest.skipUnless(PREFLIGHT_SUITE.is_file(), "preflight suite script missing")
    def test_preflight_suite_preserves_current_branch(self) -> None:
        before = self._git("branch", "--show-current")
        subprocess.run(["bash", str(PREFLIGHT_SUITE)], check=True, cwd=REPO_ROOT)
        self.assertEqual(self._git("branch", "--show-current"), before)

    @unittest.skipUnless(PREFLIGHT_SUITE.is_file(), "preflight suite script missing")
    def test_preflight_suite_preserves_working_tree(self) -> None:
        before = self._git("status", "--porcelain")
        subprocess.run(["bash", str(PREFLIGHT_SUITE)], check=True, cwd=REPO_ROOT)
        after = self._git("status", "--porcelain")
        self.assertEqual(self._filter_local_only(before), self._filter_local_only(after))

    @unittest.skipUnless(PREFLIGHT_SUITE.is_file(), "preflight suite script missing")
    def test_preflight_suite_preserves_all_existing_stashes(self) -> None:
        before = self._git("stash", "list")
        subprocess.run(["bash", str(PREFLIGHT_SUITE)], check=True, cwd=REPO_ROOT)
        self.assertEqual(before, self._git("stash", "list"))

    @unittest.skipUnless(PREFLIGHT_SUITE.is_file(), "preflight suite script missing")
    def test_preflight_suite_does_not_create_new_stash(self) -> None:
        before_count = len([ln for ln in self._git("stash", "list").splitlines() if ln.strip()])
        subprocess.run(["bash", str(PREFLIGHT_SUITE)], check=True, cwd=REPO_ROOT)
        after_count = len([ln for ln in self._git("stash", "list").splitlines() if ln.strip()])
        self.assertEqual(before_count, after_count)

    def test_preflight_suite_only_writes_under_local(self) -> None:
        before = set(p.name for p in REPO_ROOT.iterdir() if p.is_file())
        with tempfile.TemporaryDirectory(prefix="aq-", dir=LOCAL_ROOT) as tmp:
            run_preflight(
                profile_name="worksheet-letter",
                input_path=FIXTURES / "pass_worksheet.pdf",
                output_dir=Path(tmp),
                render=True,
                json_output=True,
            )
        after = set(p.name for p in REPO_ROOT.iterdir() if p.is_file())
        self.assertEqual(before, after)

    @staticmethod
    def _filter_local_only(status: str) -> str:
        lines = []
        for line in status.splitlines():
            if line.startswith("?? .local/"):
                continue
            if "tests/fixtures/artifact_quality/" in line and line.endswith(".pdf"):
                continue
            if line.startswith("?? fixtures/artifact-quality/") or " fixtures/artifact-quality/" in line:
                continue
            lines.append(line)
        return "\n".join(lines)


if __name__ == "__main__":
    unittest.main(verbosity=2)
