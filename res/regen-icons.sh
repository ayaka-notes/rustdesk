#!/bin/bash
# Full icon regeneration pipeline. Run after updating res/logo.svg.
#
# Order matters:
#   1) gen_icons.sh    — generates res/icon.png + macOS/Linux/Windows-res + Android round
#   2) flutter_launcher_icons — generates Android adaptive/iOS/Windows-flutter from res/*.png
#   3) post-fixups     — moves drawable-*dpi/foreground into mipmap-*dpi/ (matches HEAD layout)
#                        and re-runs ic_launcher_round.png generation that step 2 may have skipped
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RD="$(cd "$SCRIPT_DIR/.." && pwd)"

# Need flutter on PATH
command -v flutter >/dev/null || { echo "flutter not in PATH. add ~/development/flutter/bin to PATH"; exit 1; }

echo ">>> Step 1: gen_icons.sh"
"$SCRIPT_DIR/gen_icons.sh"

echo ""
echo ">>> Step 2: flutter_launcher_icons"
( cd "$RD/flutter" && dart run flutter_launcher_icons )

echo ""
echo ">>> Step 3: relocate Android foreground to mipmap-*dpi (match HEAD layout)"
for dpi in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  src="$RD/flutter/android/app/src/main/res/drawable-$dpi/ic_launcher_foreground.png"
  dst="$RD/flutter/android/app/src/main/res/mipmap-$dpi/ic_launcher_foreground.png"
  [ -f "$src" ] && mv "$src" "$dst"
  rmdir "$RD/flutter/android/app/src/main/res/drawable-$dpi" 2>/dev/null || true
done
# Keep adaptive-icon XMLs referencing @mipmap/ (matches original repo layout)
sed -i 's|@drawable/ic_launcher_foreground|@mipmap/ic_launcher_foreground|g' \
  "$RD/flutter/android/app/src/main/res/mipmap-anydpi-v26/"ic_launcher*.xml

echo ">>> Step 4: regenerate ic_launcher_round.png (flutter_launcher_icons skips this)"
"$SCRIPT_DIR/gen_icons.sh" >/dev/null

echo ""
echo "All icons regenerated."
