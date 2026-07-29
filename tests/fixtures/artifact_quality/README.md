# Phase 2 Artifact Quality Fixtures

Synthetic, copyright-free PDF fixtures for Visual Preflight edge-case testing.
Generated deterministically by `scripts/artifact_quality/fixture_builder.py` — do not
commit binary PDFs; pytest generates them into this directory at runtime.

| Fixture | Purpose |
|---------|---------|
| `pass_worksheet.pdf` | Safe margins, table, writing lines |
| `warn_whitespace.pdf` | Sparse lower page + footer page number |
| `fail_clipping.pdf` | Content crosses safe margin |
| `vector_only_diagram.pdf` | Grid/axes diagram, zero text |
| `light_gray_lines.pdf` | Faint ruled writing lines |
| `student_two_pages.pdf` | 2-page student packet |
| `key_three_pages.pdf` | 3-page teacher key (page-count mismatch) |
| `student_layout.pdf` | Student questions with response boxes |
| `key_reflow_warn.pdf` | Teacher answers increase visible ink |
| `key_overflow_fail.pdf` | Answer overflow + extra page |
| `twenty_page_mixed_content.pdf` | 20-page memory/resource test |
| `image_only_map.pdf` | Raster image, no text layer |

Runtime renders and reports belong under `.local/artifact-quality/` only.
