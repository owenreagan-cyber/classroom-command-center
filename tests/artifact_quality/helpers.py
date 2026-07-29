"""Shared helpers for artifact quality Phase 2 tests."""
from __future__ import annotations

import hashlib
import platform
import resource
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURES = REPO_ROOT / "tests" / "fixtures" / "artifact_quality"
LEGACY_FIXTURES = REPO_ROOT / "fixtures" / "artifact-quality"
LOCAL_ROOT = REPO_ROOT / ".local" / "artifact-quality"
RUNNER = REPO_ROOT / "scripts" / "artifact_quality" / "run_preflight.py"
PHASE2_SUITE = REPO_ROOT / "tests" / "artifact-quality-phase2-suite.sh"
PREFLIGHT_SUITE = REPO_ROOT / "tests" / "artifact-quality-preflight-test.sh"

sys.path.insert(0, str(REPO_ROOT))


def resident_memory_mb() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    if platform.system() == "Darwin":
        return usage / (1024 * 1024)
    return usage / 1024


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_fixtures() -> None:
    from scripts.artifact_quality.fixture_builder import ensure_all_fixtures, ensure_phase2_fixtures

    ensure_phase2_fixtures(FIXTURES)
    legacy = LEGACY_FIXTURES
    legacy.mkdir(parents=True, exist_ok=True)
    ensure_all_fixtures(legacy)
