#!/usr/bin/env bash
# Reports host Playwright readiness for Apple Silicon / Intel Macs and CI-like sandboxes.
# Exit 0 when Chromium launches; exit 1 only on launch failure.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/ensure-playwright-host-env.sh
source "$ROOT/scripts/ensure-playwright-host-env.sh"

HOST_ARCH="$(uname -m)"
NODE_ARCH="$(node -p "process.arch")"
NODE_VERSION="$(node -v)"
NPM_VERSION="$(npm -v)"
PW_VERSION="$(npx playwright --version 2>/dev/null | awk '{print $2}' || echo unknown)"

echo "========================================"
echo "  Playwright Host Diagnosis"
echo "========================================"
echo ""
echo "Host architecture:  $HOST_ARCH"
echo "Node architecture:  $NODE_ARCH"
echo "Node version:       $NODE_VERSION"
echo "npm version:        $NPM_VERSION"
echo "Playwright version: $PW_VERSION"
echo ""

if [[ "$HOST_ARCH" != "$NODE_ARCH" ]]; then
  echo "WARN: Host and Node architectures differ (Rosetta or mixed toolchain)."
  echo "      Prefer native arm64 Node on Apple Silicon: node -p process.arch should print arm64."
  echo ""
fi

if env | grep -E '^(PLAYWRIGHT|npm_config_arch|npm_config_platform)=' >/dev/null 2>&1; then
  echo "Relevant environment:"
  env | grep -E '^(PLAYWRIGHT|npm_config_arch|npm_config_platform)=' || true
  echo ""
fi

echo "Installed browsers (playwright install --list):"
if npx playwright install --list 2>/dev/null; then
  :
else
  echo "WARN: Could not list Playwright browsers."
fi
echo ""

echo "Chromium launch probe:"
if node <<'NODE'
const { chromium } = require('playwright')
;(async () => {
  const browser = await chromium.launch({ headless: true })
  await browser.close()
  console.log('  Chromium launch: PASS')
})().catch((error) => {
  console.error('  Chromium launch: FAIL')
  console.error(`  ${error.message}`)
  process.exit(1)
})
NODE
then
  echo ""
  echo "========================================"
  echo "  PLAYWRIGHT HOST: PASS"
  echo "========================================"
  echo ""
  echo "If e2e tests fail elsewhere, run:"
  echo "  npx playwright uninstall --all"
  echo "  npx playwright install chromium"
  exit 0
else
  echo ""
  echo "========================================"
  echo "  PLAYWRIGHT HOST: FAIL"
  echo "========================================"
  echo ""
  echo "Remediation:"
  echo "  1. Use native Node for your CPU (arm64 on Apple Silicon)."
  echo "  2. Unset PLAYWRIGHT_BROWSERS_PATH if it points at a sandbox cache."
  echo "  3. Reinstall browsers: npx playwright uninstall --all && npx playwright install chromium"
  exit 1
fi
