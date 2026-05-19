#!/usr/bin/env python3
"""Rebrand the rustdesk-server-pro web admin static bundle.

This script never modifies its input. It copies a `static/` directory tree to
an output directory, then rewrites the copies:
  - replaces antd blue hex / rgb tokens with the ayaka pink ramp
    (configurable via mapping.json)
  - drops in branded logo.svg, favicon.png, icons/*.png from assets/
  - patches the <title> in index.html

Typical CI usage:

    # unzip the upstream static.zip from rustdesk-server-pro release
    unzip -q static.zip -d ./_upstream

    # rebrand into ./static-ayaka
    .ayaka/rebrand-server-web/rebrand.py \\
        --in  ./_upstream/static \\
        --out ./static-ayaka

    # ship ./static-ayaka next to hbbs/hbbr

Exit codes: 0 ok, 1 usage / IO error, 2 mapping file invalid.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_MAPPING = HERE / "mapping.json"
DEFAULT_ASSETS = HERE / "assets"

TEXT_SUFFIXES = {".js", ".css", ".html", ".svg", ".map", ".json", ".txt"}
SKIP_DIRS = {".git", "node_modules"}


def load_mapping(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"error: failed to parse {path}: {e}", file=sys.stderr)
        sys.exit(2)
    return data


def build_hex_pattern(color_map: dict[str, str]):
    """Build a single regex matching any source hex (case-insensitive, full token)."""
    if not color_map:
        return None, {}
    norm = {k.lower(): v for k, v in color_map.items()}
    # Sort longest first so #aabbccdd wins over #aabbcc
    keys = sorted(norm.keys(), key=len, reverse=True)
    # Use lookbehind for non-hex so #1677ff inside #1677ffee won't half-match.
    pattern = re.compile(
        r"(?<![0-9a-fA-F])(" + "|".join(re.escape(k) for k in keys) + r")(?![0-9a-fA-F])",
        re.IGNORECASE,
    )
    return pattern, norm


def build_int_pattern(int_map: dict):
    """Match decimal ARGB integers used by Flutter web's compiled `Color(N)` constants.

    Keys may be JSON ints or quoted decimal strings; values likewise. Only integers
    that already appear non-digit-bounded in the file get replaced, so an int like
    4280391411 won't accidentally collide with a different decimal embedded inside
    a longer numeric literal.
    """
    if not int_map:
        return None, {}
    norm = {int(k): int(v) for k, v in int_map.items()}
    keys = sorted((str(k) for k in norm.keys()), key=len, reverse=True)
    pattern = re.compile(r"(?<!\d)(" + "|".join(keys) + r")(?!\d)")
    return pattern, norm


def build_rgb_pattern(rgb_map: dict[str, str]):
    """Match `r, g, b` triplets ignoring whitespace inside rgb()/rgba()."""
    if not rgb_map:
        return None, {}
    norm = {}
    for k, v in rgb_map.items():
        key = tuple(int(p.strip()) for p in k.split(","))
        val = tuple(int(p.strip()) for p in v.split(","))
        norm[key] = val
    # Single pattern: capture any "r, g, b" triplet; we filter in the callback.
    pattern = re.compile(r"(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})")
    return pattern, norm


def rewrite_text(content: str, hex_re, hex_map, int_re, int_map, rgb_re, rgb_map, extra: dict[str, str]) -> tuple[str, int]:
    n = 0
    if hex_re is not None:
        def hex_sub(m):
            nonlocal n
            n += 1
            return hex_map[m.group(0).lower()]
        content = hex_re.sub(hex_sub, content)
    if int_re is not None:
        def int_sub(m):
            nonlocal n
            n += 1
            return str(int_map[int(m.group(0))])
        content = int_re.sub(int_sub, content)
    if rgb_re is not None:
        def rgb_sub(m):
            nonlocal n
            triple = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
            if triple in rgb_map:
                n += 1
                r, g, b = rgb_map[triple]
                return f"{r},{g},{b}" if "," in m.group(0) and " " not in m.group(0) else f"{r}, {g}, {b}"
            return m.group(0)
        content = rgb_re.sub(rgb_sub, content)
    for src, dst in (extra or {}).items():
        if src in content:
            content = content.replace(src, dst)
            n += 1
    return content, n


def walk_and_rewrite(out_dir: Path, hex_re, hex_map, int_re, int_map, rgb_re, rgb_map, html_extra) -> tuple[int, int]:
    files_touched = 0
    total_subs = 0
    for path in out_dir.rglob("*"):
        if path.is_dir():
            if path.name in SKIP_DIRS:
                shutil.rmtree(path, ignore_errors=True)
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            raw = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        # index.html gets the extra string replacements (e.g. title)
        extra = html_extra if path.name == "index.html" else {}
        new, n = rewrite_text(raw, hex_re, hex_map, int_re, int_map, rgb_re, rgb_map, extra)
        if n > 0:
            path.write_text(new, encoding="utf-8")
            files_touched += 1
            total_subs += n
    return files_touched, total_subs


def overlay_assets(out_dir: Path, assets_dir: Path) -> int:
    """Copy every file in assets_dir into out_dir, preserving relative paths."""
    if not assets_dir.exists():
        return 0
    n = 0
    for src in assets_dir.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(assets_dir)
        dst = out_dir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        n += 1
    return n


_LOCATION_MARKERS = {
    "${LOCATION_HOSTNAME}": "loc.hostname",
    "${LOCATION_HOST}":     "loc.host",
    "${LOCATION_ORIGIN}":   "(loc.protocol + '//' + loc.host)",
}


def _value_to_js_expr(value: str) -> str:
    """Convert a string with optional ${LOCATION_*} markers to a JS expression
    (either a string literal or a concatenation of literals + window.location parts)."""
    if not isinstance(value, str) or not any(m in value for m in _LOCATION_MARKERS):
        return json.dumps(value)
    pattern = re.compile("|".join(re.escape(m) for m in _LOCATION_MARKERS))
    parts, cursor = [], 0
    for m in pattern.finditer(value):
        if m.start() > cursor:
            parts.append(json.dumps(value[cursor:m.start()]))
        parts.append(_LOCATION_MARKERS[m.group(0)])
        cursor = m.end()
    if cursor < len(value):
        parts.append(json.dumps(value[cursor:]))
    return " + ".join(parts) if parts else "''"


def inject_web_custom_config(out_dir: Path, cfg: dict) -> bool:
    """Burn ID/relay/API + pubkey into static/web/index.html's {{CUSTOM_CONFIG}}.

    If any value uses ${LOCATION_*} markers we emit a runtime <script> that
    builds the config in the browser from window.location (so the web client
    auto-adapts to whichever host serves it). If all values are literal, we
    pre-encode the JSON as base64 at rebrand time (cheaper, no extra script).

    Env vars override mapping per-field:
        RUSTDESK_RENDEZVOUS_SERVER -> custom-rendezvous-server
        RUSTDESK_RELAY_SERVER      -> relay-server
        RUSTDESK_API_SERVER        -> api-server
        RUSTDESK_RS_PUB_KEY        -> key
    """
    if not cfg:
        return False
    idx = out_dir / "web" / "index.html"
    if not idx.exists():
        return False
    raw = idx.read_text(encoding="utf-8")
    if "{{CUSTOM_CONFIG}}" not in raw:
        return False

    merged = {
        "custom-rendezvous-server": os.environ.get("RUSTDESK_RENDEZVOUS_SERVER") or cfg.get("custom-rendezvous-server", ""),
        "relay-server":             os.environ.get("RUSTDESK_RELAY_SERVER")     or cfg.get("relay-server", ""),
        "api-server":               os.environ.get("RUSTDESK_API_SERVER")       or cfg.get("api-server", ""),
        "key":                      os.environ.get("RUSTDESK_RS_PUB_KEY")       or cfg.get("key", ""),
    }
    needs_runtime = any(
        any(m in str(v) for m in _LOCATION_MARKERS)
        for v in merged.values()
    )

    if needs_runtime:
        body = ",".join(f"{json.dumps(k)}:{_value_to_js_expr(v)}" for k, v in merged.items())
        runtime_js = (
            "(function(){var loc=window.location;"
            f"var cfg={{{body}}};"
            "var el=document.getElementById('custom-config');"
            "if(el)el.textContent=btoa(JSON.stringify(cfg));})();"
        )
        # Drop the placeholder, then attach a runtime filler right after the script tag.
        raw = raw.replace("{{CUSTOM_CONFIG}}", "")
        anchor = '<script id="custom-config" type="text/plain"></script>'
        if anchor in raw:
            raw = raw.replace(anchor, anchor + "\n    <script>" + runtime_js + "</script>")
        else:
            # Fallback: append before </head>
            raw = raw.replace("</head>", "<script>" + runtime_js + "</script>\n  </head>")
    else:
        payload = base64.b64encode(json.dumps(merged).encode("utf-8")).decode("ascii")
        raw = raw.replace("{{CUSTOM_CONFIG}}", payload)

    idx.write_text(raw, encoding="utf-8")
    return True


# Session-bridge JS: mirrors the admin access_token <-> web-client access_token.
# Goes into BOTH static/index.html (admin) and static/web/index.html (web client)
# so login on either side propagates to the other via same-origin localStorage.
def _session_bridge_js(admin_key: str, web_key: str) -> str:
    return f"""(function(){{
var A={json.dumps(admin_key)},W={json.dumps(web_key)};
function r(k){{try{{return localStorage.getItem(k)||sessionStorage.getItem(k)||null}}catch(e){{return null}}}}
function w(k,v){{try{{if(v==null){{localStorage.removeItem(k);sessionStorage.removeItem(k);}}else{{localStorage.setItem(k,v);}}}}catch(e){{}}}}
// Initial: copy non-empty to empty
var a=r(A),b=r(W);
if(a&&!b)w(W,a); else if(b&&!a)w(A,b);
// Cross-tab: storage event fires in OTHER tabs when one writes.
window.addEventListener('storage',function(ev){{
  if(ev.key!==A&&ev.key!==W)return;
  var other=ev.key===A?W:A;
  if(ev.newValue==null){{w(other,null);}}
  else if(r(other)!==ev.newValue){{w(other,ev.newValue);}}
}});
}})();"""


def inject_session_bridge(out_dir: Path, cfg: dict) -> int:
    """Insert the mirror script into admin + web index.html. Returns # files patched."""
    if not cfg or not cfg.get("enabled"):
        return 0
    js = _session_bridge_js(cfg.get("admin_key", "access_token"),
                            cfg.get("web_key",   "wc-option:local:access_token"))
    snippet = "    <script>" + js + "</script>\n  "
    # Sentinel comment so we don't double-inject on re-runs
    marker = "ayaka-session-bridge"
    wrapped = f"<!-- {marker} -->\n" + snippet
    patched = 0
    for rel in ("index.html", "web/index.html"):
        p = out_dir / rel
        if not p.exists():
            continue
        raw = p.read_text(encoding="utf-8")
        if marker in raw:
            continue
        if "</head>" in raw:
            new = raw.replace("</head>", wrapped + "</head>", 1)
            p.write_text(new, encoding="utf-8")
            patched += 1
    return patched


def assert_session_keys(out_dir: Path, cfg: dict) -> None:
    """CI guard: fail loud if upstream renamed the storage keys our bridge depends on.

    Sentinels are literal substrings expected to appear in specific file globs.
    Missing any -> exit non-zero so CI catches the regression before release.
    """
    if not cfg or not cfg.get("enabled"):
        return
    sentinels = cfg.get("sentinels", [])
    errors = []
    for s in sentinels:
        glob = s["in"]
        needle = s["contains"]
        hits = list(out_dir.glob(glob))
        if not hits:
            errors.append(f"  sentinel {glob!r}: no files matched")
            continue
        if not any(needle in p.read_text(encoding="utf-8", errors="ignore") for p in hits):
            errors.append(f"  sentinel {glob!r}: substring {needle!r} not found in any of {[p.name for p in hits]}")
    if errors:
        sys.stderr.write(
            "error: session-bridge sentinel check failed — upstream key names "
            "may have changed, mirror script will silently no-op:\n" + "\n".join(errors) + "\n"
        )
        sys.exit(3)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--in", dest="src", required=True, type=Path, help="Path to upstream static/ directory.")
    ap.add_argument("--out", dest="dst", required=True, type=Path, help="Path to write rebranded copy (will be wiped if --force).")
    ap.add_argument("--mapping", default=DEFAULT_MAPPING, type=Path, help=f"Color mapping JSON (default: {DEFAULT_MAPPING.name})")
    ap.add_argument("--assets", default=DEFAULT_ASSETS, type=Path, help=f"Branded asset overlay dir (default: {DEFAULT_ASSETS.name})")
    ap.add_argument("--force", action="store_true", help="Wipe --out if it already exists.")
    args = ap.parse_args()

    if not args.src.is_dir():
        print(f"error: --in {args.src} is not a directory", file=sys.stderr)
        return 1
    if args.dst.exists():
        if not args.force:
            print(f"error: --out {args.dst} exists (use --force to overwrite)", file=sys.stderr)
            return 1
        shutil.rmtree(args.dst)
    args.dst.parent.mkdir(parents=True, exist_ok=True)

    print(f"==> copying {args.src} -> {args.dst}")
    shutil.copytree(args.src, args.dst)

    mapping = load_mapping(args.mapping)
    hex_re, hex_map = build_hex_pattern(mapping.get("colors", {}))
    int_re, int_map = build_int_pattern(mapping.get("int_argb", {}))
    rgb_re, rgb_map = build_rgb_pattern(mapping.get("rgb", {}))
    html_extra = mapping.get("_index_html_replacements", {})

    print(f"==> rewriting text files (mapping: {args.mapping.name})")
    files, subs = walk_and_rewrite(args.dst, hex_re, hex_map, int_re, int_map, rgb_re, rgb_map, html_extra)
    print(f"    {subs} substitutions across {files} files")

    print(f"==> overlaying branded assets from {args.assets}")
    n = overlay_assets(args.dst, args.assets)
    print(f"    {n} asset files copied")

    if inject_web_custom_config(args.dst, mapping.get("web_custom_config", {})):
        print(f"==> baked web/index.html custom-config (id/relay/api + pubkey)")

    bridged = inject_session_bridge(args.dst, mapping.get("session_bridge", {}))
    if bridged:
        print(f"==> injected session bridge into {bridged} index.html")

    assert_session_keys(args.dst, mapping.get("session_bridge", {}))

    print(f"done: {args.dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
