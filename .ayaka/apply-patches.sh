#!/bin/bash
# Apply ayaka-notes branding patches to vendored submodule(s) and host repo.
# Run after `git submodule update --init --recursive`.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RD="$(cd "$SCRIPT_DIR/.." && pwd)"

# Bundle name produced by the rebranded Flutter build (must match
# flutter/macos/Runner/Configs/AppInfo.xcconfig PRODUCT_NAME).
AYAKA_BUNDLE_NAME="${AYAKA_BUNDLE_NAME:-RustDeskAyakaNotes}"

for patch in "$SCRIPT_DIR"/patches/hbb_common-*.patch; do
  [ -f "$patch" ] || continue
  echo "Applying $(basename "$patch") to libs/hbb_common"
  (cd "$RD/libs/hbb_common" && git apply --check "$patch" && git apply "$patch")
done

# Rewrite hardcoded RustDesk.app references in build.py so the macOS
# post-flutter-build cp/codesign/create-dmg targets the rebranded bundle.
# Idempotent: a second run finds no RustDesk.app left to replace.
if grep -q "RustDesk\.app" "$RD/build.py"; then
  echo "Patching build.py: RustDesk.app -> ${AYAKA_BUNDLE_NAME}.app"
  sed -i.ayaka.bak "s|RustDesk\.app|${AYAKA_BUNDLE_NAME}.app|g" "$RD/build.py"
  rm -f "$RD/build.py.ayaka.bak"
fi

echo "All ayaka patches applied."
