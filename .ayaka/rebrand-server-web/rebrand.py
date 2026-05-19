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
import json
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


def rewrite_text(content: str, hex_re, hex_map, rgb_re, rgb_map, extra: dict[str, str]) -> tuple[str, int]:
    n = 0
    if hex_re is not None:
        def hex_sub(m):
            nonlocal n
            n += 1
            return hex_map[m.group(0).lower()]
        content = hex_re.sub(hex_sub, content)
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


def walk_and_rewrite(out_dir: Path, hex_re, hex_map, rgb_re, rgb_map, html_extra) -> tuple[int, int]:
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
        new, n = rewrite_text(raw, hex_re, hex_map, rgb_re, rgb_map, extra)
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
    rgb_re, rgb_map = build_rgb_pattern(mapping.get("rgb", {}))
    html_extra = mapping.get("_index_html_replacements", {})

    print(f"==> rewriting text files (mapping: {args.mapping.name})")
    files, subs = walk_and_rewrite(args.dst, hex_re, hex_map, rgb_re, rgb_map, html_extra)
    print(f"    {subs} substitutions across {files} files")

    print(f"==> overlaying branded assets from {args.assets}")
    n = overlay_assets(args.dst, args.assets)
    print(f"    {n} asset files copied")

    print(f"done: {args.dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
