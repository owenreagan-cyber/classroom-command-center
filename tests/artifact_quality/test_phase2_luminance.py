#!/usr/bin/env python3
"""Phase 2 pixel luminance and background classification tests."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

import fitz
from PIL import Image, ImageDraw

from scripts.artifact_quality.profiles import load_profile
from scripts.artifact_quality.visual_geometry import (
    _estimate_background_luminance,
    _render_printable_clip,
    analyze_page_visual,
    compute_visible_ink,
)
from tests.artifact_quality.helpers import FIXTURES, ensure_fixtures


class LuminanceClassificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        ensure_fixtures()
        cls.profile = load_profile("worksheet-letter")
        cls.spec = cls.profile.visual_geometry

    def test_white_page_has_near_zero_visible_ink(self) -> None:
        img = Image.new("RGB", (400, 520), (255, 255, 255))
        pct, mask = compute_visible_ink(img, self.spec)
        self.assertLess(pct, 0.5)
        self.assertEqual(sum(sum(row) for row in mask), 0)

    def test_off_white_background_not_counted_as_full_page_ink(self) -> None:
        img = Image.new("RGB", (400, 520), (252, 252, 250))
        pct, _ = compute_visible_ink(img, self.spec)
        self.assertLess(pct, 2.0)

    def test_antialiased_text_is_detected(self) -> None:
        img = Image.new("RGB", (400, 520), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.rectangle([40, 80, 320, 110], fill=(0, 0, 0))
        for x in range(40, 320):
            img.putpixel((x, 95), (40, 40, 40))
        pct, mask = compute_visible_ink(img, self.spec)
        self.assertGreater(pct, 0.3)
        self.assertGreater(sum(sum(row) for row in mask), 50)

    def test_light_gray_writing_lines_are_detected(self) -> None:
        doc = fitz.open(FIXTURES / "light_gray_lines.pdf")
        metrics, _, _, _ = analyze_page_visual(doc[0], 1, self.profile)
        doc.close()
        self.assertGreater(max(metrics.drawing_coverage_percent, metrics.visible_ink_percent), 0.2)
        self.assertLess(metrics.visible_ink_percent, 25.0)

    def test_shaded_callout_box_is_detected_without_filling_entire_page(self) -> None:
        img = Image.new("RGB", (400, 520), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.rectangle([40, 100, 360, 200], fill=(225, 225, 200))
        draw.rectangle([50, 120, 120, 140], fill=(0, 0, 0))
        pct, _ = compute_visible_ink(img, self.spec)
        self.assertGreater(pct, 1.0)
        self.assertLess(pct, 40.0)

    def test_pale_background_does_not_classify_entire_page_as_ink(self) -> None:
        img = Image.new("RGB", (400, 520), (248, 248, 246))
        pct, _ = compute_visible_ink(img, self.spec)
        self.assertLess(pct, 3.0)

    def test_dynamic_threshold_is_stable_across_supported_render_dpi(self) -> None:
        doc = fitz.open(FIXTURES / "pass_worksheet.pdf")
        page = doc[0]
        percents: list[float] = []
        for dpi in (72, 96, 144):
            image, _ = _render_printable_clip(page, self.profile, dpi)
            pct, _ = compute_visible_ink(image, self.spec)
            percents.append(pct)
            image.close()
        doc.close()
        spread = max(percents) - min(percents)
        self.assertLess(spread, 8.0, f"ink spread across DPI: {percents}")

    def test_background_luminance_on_white_and_off_white(self) -> None:
        white = Image.new("RGB", (120, 120), (255, 255, 255))
        off_white = Image.new("RGB", (120, 120), (252, 252, 250))
        self.assertGreater(_estimate_background_luminance(white), 245.0)
        self.assertGreater(_estimate_background_luminance(off_white), 240.0)
        self.assertLess(abs(_estimate_background_luminance(white) - _estimate_background_luminance(off_white)), 15.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
