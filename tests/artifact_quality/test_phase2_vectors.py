#!/usr/bin/env python3
"""Phase 2 pure vector and text-less diagram tests."""
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
from scripts.artifact_quality.visual_geometry import analyze_page_visual
from tests.artifact_quality.helpers import FIXTURES, ensure_fixtures


class VectorDiagramTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        ensure_fixtures()
        cls.profile = load_profile("worksheet-letter")

    def test_vector_only_diagram_is_not_blank(self) -> None:
        doc = fitz.open(FIXTURES / "vector_only_diagram.pdf")
        page = doc[0]
        text = page.get_text("text").strip()
        metrics, _, _, _ = analyze_page_visual(page, 1, self.profile)
        doc.close()
        self.assertEqual(len(text), 0)
        self.assertLess(metrics.text_coverage_percent, 1.0)
        self.assertGreater(metrics.drawing_coverage_percent, 0.0)
        self.assertGreater(metrics.visible_ink_percent, 0.15)
        self.assertNotIn(metrics.page_balance, {"title-only"})

    def test_vector_response_lines_count_as_writing_structure(self) -> None:
        doc = fitz.open(FIXTURES / "vector_response_lines.pdf")
        metrics, _, _, _ = analyze_page_visual(doc[0], 1, self.profile)
        doc.close()
        self.assertGreater(metrics.drawing_coverage_percent, 0.0)
        self.assertGreater(metrics.writing_space_percent, 0.0)

    def test_image_only_page_has_visible_ink(self) -> None:
        doc = fitz.open(FIXTURES / "image_only_map.pdf")
        page = doc[0]
        text = page.get_text("text").strip()
        metrics, _, _, _ = analyze_page_visual(page, 1, self.profile)
        doc.close()
        self.assertEqual(len(text), 0)
        self.assertLess(metrics.text_coverage_percent, 2.0)
        self.assertGreater(metrics.visible_ink_percent, 1.0)

    def test_vector_clipping_triggers_fail(self) -> None:
        report = run_preflight(
            profile_name="worksheet-letter",
            input_path=FIXTURES / "fail_clipping.pdf",
        )
        self.assertEqual(report.final_status, CheckStatus.FAIL)
        fail_msgs = " ".join(c.message for c in report.checks if c.status == CheckStatus.FAIL)
        self.assertIn("safe", fail_msgs.lower())

    def test_zero_text_does_not_imply_zero_utilization(self) -> None:
        report = run_preflight(
            profile_name="worksheet-letter",
            input_path=FIXTURES / "vector_only_diagram.pdf",
        )
        metrics = report.page_metrics[0]
        self.assertLess(metrics["text_coverage_percent"], 1.0)
        combined = max(
            metrics["visible_ink_percent"],
            metrics["drawing_coverage_percent"],
        )
        self.assertGreater(combined, 0.1)

    def test_light_gray_vector_diagram_has_measurable_ink(self) -> None:
        doc = fitz.open(FIXTURES / "light_gray_lines.pdf")
        metrics, _, _, _ = analyze_page_visual(doc[0], 1, self.profile)
        doc.close()
        self.assertGreater(metrics.visible_ink_percent, 0.1)
        self.assertLess(metrics.visible_ink_percent, 30.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
