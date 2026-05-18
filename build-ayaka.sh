#!/bin/bash
# Build branded RustDesk@ayaka-notes with embedded server/key/api/theme.
#
# Override any of these by setting the env var before running:
#   RUSTDESK_RENDEZVOUS_SERVER  ID server hostname     (default: remote.ayaka.space)
#   RUSTDESK_RS_PUB_KEY         hbbs public key        (default: project key)
#   RUSTDESK_API_SERVER         API base URL           (default: https://remote.ayaka.space)
#   RUSTDESK_APP_NAME           Internal app name      (default: RustDeskAyakaNotes)
#   RUSTDESK_ACCENT_ARGB        UI accent color ARGB   (default: 0xFFFF5C8A pink)
#   RUSTDESK_BUTTON_ARGB        UI button color ARGB   (default: 0xFFFF85A8)
#
# Pass extra args after `--` to build.py, e.g.:
#   ./build-ayaka.sh -- --flutter
set -e

# Rust compile-time vars (read by option_env! in config.rs and common.rs)
export RUSTDESK_RENDEZVOUS_SERVER="${RUSTDESK_RENDEZVOUS_SERVER:-remote.ayaka.space}"
: "${RUSTDESK_RS_PUB_KEY:?RUSTDESK_RS_PUB_KEY must be set (export it before running)}"
export RUSTDESK_API_SERVER="${RUSTDESK_API_SERVER:-https://remote.ayaka.space}"
export RUSTDESK_APP_NAME="${RUSTDESK_APP_NAME:-RustDeskAyakaNotes}"

# Flutter compile-time vars (forwarded via FLUTTER_BUILD_DEFINES in build.py? No — see note below)
export RUSTDESK_ACCENT_ARGB="${RUSTDESK_ACCENT_ARGB:-0xFFFF5C8A}"
export RUSTDESK_BUTTON_ARGB="${RUSTDESK_BUTTON_ARGB:-0xFFFF85A8}"

# Force any 'flutter build' invocation to receive our dart-defines.
# We do this by exporting FLUTTER_BUILD_ARGS which `build.py` ignores, so
# we wrap `flutter` itself via PATH shim.
SHIM_DIR="$(mktemp -d)"
trap "rm -rf $SHIM_DIR" EXIT
cat > "$SHIM_DIR/flutter" <<EOF
#!/bin/bash
real_flutter="\$(PATH="$(echo "$PATH" | tr ':' '\n' | grep -v "^$SHIM_DIR$" | paste -sd:)" command -v flutter)"
if [ "\$1" = "build" ]; then
  shift
  exec "\$real_flutter" build "\$@" \\
    --dart-define=RUSTDESK_ACCENT_ARGB=$RUSTDESK_ACCENT_ARGB \\
    --dart-define=RUSTDESK_BUTTON_ARGB=$RUSTDESK_BUTTON_ARGB
fi
exec "\$real_flutter" "\$@"
EOF
chmod +x "$SHIM_DIR/flutter"
export PATH="$SHIM_DIR:$PATH"

echo "=== Branded build ==="
echo "  Rendezvous : $RUSTDESK_RENDEZVOUS_SERVER"
echo "  API        : $RUSTDESK_API_SERVER"
echo "  Key        : ${RUSTDESK_RS_PUB_KEY:0:12}..."
echo "  App name   : $RUSTDESK_APP_NAME"
echo "  Accent     : $RUSTDESK_ACCENT_ARGB"
echo

# Default to flutter build if user didn't pass args
if [ $# -eq 0 ]; then
  set -- --flutter
fi

# Strip leading '--' separator
[ "$1" = "--" ] && shift

cd "$(dirname "$0")"
exec python3 build.py "$@"
