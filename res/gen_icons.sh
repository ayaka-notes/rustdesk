#!/bin/bash
# Regenerate RustDesk branding assets from a source SVG.
#
# This script handles the parts that flutter_launcher_icons does NOT cover:
#   - res/icon.png + res/mac-icon.png   (canonical 1024 sources)
#   - res/{32,64,128}x{...}.png         (Linux .desktop icons)
#   - res/icon.ico / res/tray-icon.ico  (Windows-style multi-size ico)
#   - res/mac-tray-{dark,light}-x2.png  (macOS tray)
#   - res/logo.svg, scalable.svg, flutter/assets/icon.svg   (SVG copies)
#   - flutter/macos/Runner/AppIcon.icns (macOS legacy bundle)
#
# After running this, for Android / iOS / Windows app icon, run:
#   cd flutter && dart run flutter_launcher_icons
#
# Required tools: rsvg-convert, ImageMagick (convert), png2icns
#
# Usage:  ./res/gen_icons.sh [path/to/source.svg]
#         Default source: res/logo.svg
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RD="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="${1:-$RD/res/logo.svg}"
TMP="$(mktemp -d)"
trap "rm -rf $TMP" EXIT

[ -f "$SRC" ] || { echo "Source SVG not found: $SRC"; exit 1; }
for c in rsvg-convert convert png2icns; do
  command -v $c >/dev/null || { echo "Missing tool: $c"; exit 1; }
done

# Proportions measured from original RustDesk icons (git HEAD).
# Different shape styles use different logo sizing:
#   full_squircle / circle: logo ≈ 81% of canvas  (logo nearly fills card)
#   squircle (padded card): logo ≈ 60% of canvas  (small logo inside padded card)
LOGO_PCT_FULL=81      # for full_squircle, circle, white modes
LOGO_PCT_PADDED=60    # for padded squircle (mac-icon)
BG_PCT=81             # squircle bg size as % of canvas
CORNER_PCT=10         # squircle corner radius as % of bg
CIRCLE_DIAM_PCT=92    # circle diameter as % of canvas

echo "Source: $SRC"

# ---------- Render logo once (transparent) ----------
rsvg-convert -w 1024 -h 1024 "$SRC" -o "$TMP/logo_1024.png"

# build_icon <canvas> <out> <transparent_corners=yes|no> <shape=squircle|circle|full_squircle>
#   squircle     — white rounded square at 79% of canvas (Android legacy launcher, mac-icon)
#   circle       — white circle at 92% of canvas (Android ic_launcher_round)
#   full_squircle — white rounded square filling canvas, 11% corner radius (res/icon.png, Linux)
build_icon() {
  local canvas=$1 out=$2 trans=$3 shape=$4
  # Optional 5th arg overrides the default logo size for this shape
  local logo_pct=${5:-$LOGO_PCT_FULL}
  [ "$shape" = "squircle" ] && [ -z "${5:-}" ] && logo_pct=$LOGO_PCT_PADDED
  local logo=$(( canvas * logo_pct / 100 ))
  local cx=$(( canvas / 2 ))

  local bg_canvas
  if [ "$trans" = "yes" ]; then bg_canvas="xc:none"; else bg_canvas="xc:white"; fi

  case "$shape" in
    circle)
      local cr=$(( canvas * CIRCLE_DIAM_PCT / 200 ))
      convert -size ${canvas}x${canvas} $bg_canvas \
              -fill white -draw "circle ${cx},${cx} ${cx},$(( cx + cr ))" \
              \( "$TMP/logo_1024.png" -resize ${logo}x${logo} \) \
              -gravity center -composite "$out"
      ;;
    full_squircle)
      # White rounded rect filling the canvas, gentle ~11% corner radius
      local r=$(( canvas * 11 / 100 ))
      local m=$(( canvas - 1 ))
      convert -size ${canvas}x${canvas} $bg_canvas \
              -fill white -draw "roundrectangle 0,0 ${m},${m} ${r},${r}" \
              \( "$TMP/logo_1024.png" -resize ${logo}x${logo} \) \
              -gravity center -composite "$out"
      ;;
    *)
      # squircle: bg at 79% of canvas, corner r at 10% of bg
      local bg=$(( canvas * BG_PCT / 100 ))
      local off=$(( (canvas - bg) / 2 ))
      local far=$(( off + bg - 1 ))
      local r=$(( bg * CORNER_PCT / 100 ))
      convert -size ${canvas}x${canvas} $bg_canvas \
              -fill white -draw "roundrectangle ${off},${off} ${far},${far} ${r},${r}" \
              \( "$TMP/logo_1024.png" -resize ${logo}x${logo} \) \
              -gravity center -composite "$out"
      ;;
  esac
}

# ---------- SVG copies ----------
echo "==> SVGs"
SRC_CONTENT=$(cat "$SRC")
INNER=$(printf '%s' "$SRC_CONTENT" | sed -E 's|^.*<svg[^>]*>||; s|</svg>.*$||')

write_logo_svg() {
  local out=$1 w=$2 h=$3
  if [ -z "$w" ]; then
    printf '%s' "$SRC_CONTENT" | sed -E 's/ width="[^"]+"//; s/ height="[^"]+"//' > "$out"
  else
    printf '%s' "$SRC_CONTENT" | sed -E "s/ width=\"[^\"]+\"/ width=\"$w\"/; s/ height=\"[^\"]+\"/ height=\"$h\"/" > "$out"
  fi
}
write_logo_svg "$RD/res/logo.svg"            "26"  "26"
write_logo_svg "$RD/flutter/assets/icon.svg" ""    ""

# scalable.svg wraps logo with white rounded-rect background (matches original structure)
cat > "$RD/res/scalable.svg" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" width="32" height="32" viewBox="63.993 894.484 32 32" style="isolation:isolate">
  <rect x="63.993" y="894.484" width="32" height="32" rx="5" ry="5" fill="#ffffff"/>
  ${INNER}
</svg>
EOF
# NOTE: res/logo-header.svg is a 1000x286 banner with text — leave alone

# ---------- res/ raster icons ----------
echo "==> res/ rasters"
# 1024 canonical sources used by flutter_launcher_icons.
# res/icon.png      — full canvas style (Linux/Windows .ico use this directly)
# res/android-icon.png — 81% squircle (Android wants a smaller card)
# res/mac-icon.png  — macOS style with margin
build_icon 1024 "$RD/res/icon.png"         yes full_squircle
build_icon 1024 "$RD/res/android-icon.png" yes squircle 60
build_icon 1024 "$RD/res/mac-icon.png"     yes squircle

# iOS source: full white square, no rounded corners (Apple forbids alpha).
# Logo at 81% of canvas (832/1024), matching original RustDesk iOS icon.
{
  ios_logo=$(( 1024 * 81 / 100 ))
  convert -size 1024x1024 xc:white \
          \( "$TMP/logo_1024.png" -resize ${ios_logo}x${ios_logo} \) \
          -gravity center -composite -alpha remove -alpha off \
          "$RD/res/ios-icon.png"
}

# Android adaptive icon foreground: logo only on transparent 1024 canvas,
# scaled to ~50% (Android's adaptive icon "safe zone").
{
  fg_logo=$(( 1024 * 50 / 100 ))
  convert -size 1024x1024 xc:none \
          \( "$TMP/logo_1024.png" -resize ${fg_logo}x${fg_logo} \) \
          -gravity center -composite "$RD/res/icon_foreground.png"
}

# Linux .desktop icons (small sizes) — full canvas style like original
for s in 32 64 128; do
  build_icon $s "$RD/res/${s}x${s}.png" yes full_squircle
done
build_icon 256 "$RD/res/128x128@2x.png" yes full_squircle

# res/icon.ico — 5 sub-images (16/32/48/64/128) matching original, full canvas
for s in 16 32 48 64 128; do
  build_icon $s "$TMP/ico_${s}.png" yes full_squircle
done
convert $TMP/ico_16.png $TMP/ico_32.png $TMP/ico_48.png \
        $TMP/ico_64.png $TMP/ico_128.png "$RD/res/icon.ico"

# res/tray-icon.ico — single 32x32 (matches original)
build_icon 32 "$TMP/tray_32.png" yes full_squircle
convert "$TMP/tray_32.png" "$RD/res/tray-icon.ico"

# Flutter home-page logo — flutter/lib/common.dart loadLogo() loads
# assets/logo.png and renders it inside a 300x60 box on the desktop
# home page left column. Logo only, transparent, no background card.
convert -size 120x120 xc:none \
        \( "$TMP/logo_1024.png" -resize 120x120 \) \
        -gravity center -composite "$RD/flutter/assets/logo.png"

# macOS tray PNGs — logo-only on transparent canvas.
# These are rendered as TEMPLATE images by macOS (see src/tray.rs
# with_icon_as_template(true)), so every non-transparent pixel becomes
# white (dark menu bar) / black (light menu bar). If we used full_squircle
# here, the white card behind the logo would fill the entire alpha channel
# and the menu bar would show a solid white blob instead of the ring shape.
# Logo at ~85% of canvas so the ring reads clearly at small menu-bar sizes.
{
  for entry in "60:$RD/res/mac-tray-dark-x2.png" "48:$RD/res/mac-tray-light-x2.png"; do
    sz=${entry%%:*}; out=${entry#*:}
    logo=$(( sz * 85 / 100 ))
    convert -size ${sz}x${sz} xc:none \
            \( "$TMP/logo_1024.png" -resize ${logo}x${logo} \) \
            -gravity center -composite "$out"
  done
}

# ---------- Android ic_launcher_round.png (per dpi, circle) ----------
# flutter_launcher_icons does not generate the round variant, so we do it
# here. AndroidManifest references @mipmap/ic_launcher_round.
echo "==> Android ic_launcher_round.png"
A="$RD/flutter/android/app/src/main/res"
for entry in "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192"; do
  dpi=${entry%:*}; size=${entry#*:}
  build_icon $size "$A/mipmap-$dpi/ic_launcher_round.png" yes circle 69
done

# ---------- macOS legacy .icns ----------
# Use full_squircle (rounded rect filling the whole 1024 canvas with ~11%
# corner radius) rather than the padded squircle. macOS does NOT auto-round
# app icons the way iOS does — the artwork must already be the final
# squircle shape, edge-to-edge. A padded squircle ends up rendered as a
# small white card floating inside macOS's default gray frame.
echo "==> macOS .icns"
ICNSET="$TMP/AppIcon.iconset"
mkdir -p "$ICNSET"
for s in 16 32 64 128 256 512 1024; do
  build_icon $s "$ICNSET/icon_${s}.png" yes full_squircle
done
png2icns "$TMP/AppIcon.icns" \
  $ICNSET/icon_16.png $ICNSET/icon_32.png \
  $ICNSET/icon_128.png $ICNSET/icon_256.png \
  $ICNSET/icon_512.png $ICNSET/icon_1024.png >/dev/null
cp "$TMP/AppIcon.icns" "$RD/flutter/macos/Runner/AppIcon.icns"

echo ""
echo "Done. Source PNGs (res/icon.png, res/mac-icon.png) and platform"
echo "auxiliaries written. To regenerate Android/iOS/Windows app icons:"
echo ""
echo "  cd flutter && dart run flutter_launcher_icons"
