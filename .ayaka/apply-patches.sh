#!/bin/bash
# Apply ayaka-notes branding patches to vendored submodule(s).
# Run after `git submodule update --init --recursive`.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RD="$(cd "$SCRIPT_DIR/.." && pwd)"

for patch in "$SCRIPT_DIR"/patches/hbb_common-*.patch; do
  [ -f "$patch" ] || continue
  echo "Applying $(basename "$patch") to libs/hbb_common"
  (cd "$RD/libs/hbb_common" && git apply --check "$patch" && git apply "$patch")
done

echo "All ayaka patches applied."
