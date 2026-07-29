#!/usr/bin/env python3
"""Phase 2 footer isolation and bottom-whitespace tests."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

import fitz

from scripts.artifact_quality.models import CheckStatus
from scripts.artifact_quality.profiles import load_profile
from scripts.artifact_quality.run_preflight import run_preflight
from scripts.artifact_quality.visual_geometry import analyze_page_visual, compute_bottom_whitespace
from tests.artifact_quality.helpers import FIXTURES, ensure_fixtures


class FooterIsolationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        ensure_fixtures()
        cls.profile = load_profile("worksheet-letter")

    def test_footer_does_not_mask_large_bottom_whitespace(self) -> None:
        report = run_preflight(
            profile_name="worksheet-letter",
            input_path=FIXTURES / "warn_whitespace.pdf",
        )
        metrics = report.page_metrics[0]
        self.assertGreater(metrics["bottom_whitespace_inches"], 1.5)
        self.assertIn(report.final_status, {CheckStatus.WARN, CheckStatus.FAIL})
        warn_msgs = [c.message.lower() for c in report.checks if c.status == CheckStatus.WARN]
        self.assertTrue(
            any("bottom gap" in m or "page balance" in m or "sparse" in m or "empty" in m for m in warn_msgs),
            f"expected whitespace WARN, got: {warn_msgs}",
        )
        self.assertNotEqual(report.final_status, CheckStatus.PASS)

    def test_footer_ignore_height_is_respected(self) -> None:
        doc = fitz.open(FIXTURES / "warn_whitespace.pdf")
        metrics, _, ink_mask, clip = analyze_page_visual(doc[0], 1, self.profile)
        doc.close()
        self.assertIsNotNone(ink_mask)
        self.assertIsNotNone(clip)
        assert ink_mask is not None and clip is not None
        gap_with_footer = compute_bottom_whitespace(
            ink_mask, clip, self.profile.visual_geometry.analysis_dpi,
            self.profile.visual_geometry, metrics.writing_space_percent,
        )
        self.assertGreater(gap_with_footer, 1.5)
        self.assertLess(metrics.visible_ink_percent, 15.0)

    def test_body_content_below_footer_boundary_is_not_ignored(self) -> None:
        doc = fitz.open(FIXTURES / "writing_lines_lower_page.pdf")
        metrics, _, _, _ = analyze_page_visual(doc[0], 1, self.profile)
        doc.close()
        self.assertGreater(max(metrics.drawing_coverage_percent, metrics.visible_ink_percent), 0.1)
        self.assertLess(metrics.bottom_whitespace_inches, 2.0)

    def test_writing_lines_count_as_instructional_usage(self) -> None:
        report = run_preflight(
            profile_name="worksheet-letter",
            input_path=FIXTURES / "writing_lines_lower_page.pdf",
        )
        metrics = report.page_metrics[0]
        bottom_gap_msgs = [c for c in report.checks if "large bottom gap" in c.message.lower()]
        self.assertFalse(bottom_gap_msgs, "writing lines should reduce false bottom-gap WARN")

    def test_page_number_only_page_is_reported_as_nearly_empty(self) -> None:
        report = run_preflight(
            profile_name="worksheet-letter",
            input_path=FIXTURES / "page_number_only.pdf",
        )
        self.assertIn(report.final_status, {CheckStatus.WARN, CheckStatus.FAIL})
        metrics = report.page_metrics[0]
        self.assertLess(metrics["text_coverage_percent"], 5.0)
        self.assertLess(metrics["visible_ink_percent"], 5.0)

    def test_footer_text_is_detected_on_page(self) -> None:
        doc = fitz.open(FIXTURES / "warn_whitespace.pdf")
        text = doc[0].get_text("text")
        doc.close()
        self.assertIn("Page 1 of 3", text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
