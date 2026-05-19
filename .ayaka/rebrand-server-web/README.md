# Rebrand: rustdesk-server-pro web admin

Rewrites the `static/` bundle shipped with `rustdesk-server-pro` so the
React/Ant-Design web console matches the ayaka pink theme (see
[`../THEME.md`](../THEME.md)). The upstream `static/` directory is **never
modified** — output goes to a separate directory you control.

## What it does

1. Copies the source `static/` tree to your output directory.
2. Walks every `.js / .css / .html / .svg / .map / .json` file and applies
   the color substitutions from [`mapping.json`](./mapping.json):
   - Antd's 10-stop blue ramp → ayaka 10-stop pink ramp
   - Legacy blues (`#1890FF`, `#2EABFF`, `#0071FF`, ...) → pink equivalents
   - `rgb(r,g,b)` triplet forms of the same colors
3. Overlays branded assets from [`./assets/`](./assets/):
   - `logo.svg` (the brand ring SVG from `res/logo.svg`)
   - `favicon.png` (32×32)
   - `icons/icon-{128,192,512}x{...}.png` (PWA manifest icons)
4. Rewrites `<title>RustDesk Console</title>` → `<title>Ayaka Console</title>`
   (configurable via `_index_html_replacements` in `mapping.json`).

## Usage

```bash
.ayaka/rebrand-server-web/rebrand.py \
  --in  /path/to/upstream/static \
  --out /path/to/output/static-ayaka \
  --force
```

Options:

| Flag         | Default            | Notes                                  |
|--------------|--------------------|----------------------------------------|
| `--in`       | (required)         | Upstream `static/` dir, untouched      |
| `--out`      | (required)         | Output dir; refuses to overwrite unless `--force` |
| `--mapping`  | `mapping.json`     | Color/string substitution table        |
| `--assets`   | `assets/`          | Asset overlay (any file tree)          |
| `--force`    | off                | Wipe `--out` if it exists              |

## CI integration

Example GitHub Actions step (after fetching upstream `static.zip`):

```yaml
- name: Rebrand server-pro web admin
  run: |
    unzip -q upstream-static.zip -d _upstream
    .ayaka/rebrand-server-web/rebrand.py \
      --in  _upstream/static \
      --out static-ayaka \
      --force
    (cd static-ayaka && zip -qr ../static-ayaka.zip .)

- uses: actions/upload-artifact@v4
  with:
    name: static-ayaka
    path: static-ayaka.zip
```

Then drop `static-ayaka/` next to `hbbs`/`hbbr` on the server and restart
(it's served by `hbbs`'s built-in HTTP).

## Making a new theme

1. Copy `mapping.json` → `mapping-yourtheme.json`.
2. Edit the right-hand hexes to your ramp (see [`../THEME.md`](../THEME.md) §6).
3. Replace `assets/logo.svg` + regenerate `assets/favicon.png` and
   `assets/icons/*.png` from your new SVG.
4. Run `rebrand.py --mapping mapping-yourtheme.json ...`.

## Regenerating brand rasters

The PNG assets in `assets/` are derived from `res/logo.svg`. To regenerate:

```bash
rsvg-convert -w 1024 -h 1024 res/logo.svg > /tmp/logo.png
convert -size 32x32   xc:none \( /tmp/logo.png -resize 32x32   \) -gravity center -composite .ayaka/rebrand-server-web/assets/favicon.png
for s in 128 192 512; do
  convert -size ${s}x${s} xc:none \( /tmp/logo.png -resize ${s}x${s} \) \
          -gravity center -composite .ayaka/rebrand-server-web/assets/icons/icon-${s}x${s}.png
done
```

## Limitations

- Only literal hex / rgb tokens are matched. If antd ships a future bundle that
  uses an HSL or named color, add it to `mapping.json`.
- The minified bundle is content-hashed (`umi.<hash>.js`). When upstream ships a
  new release the filenames change, but the script is filename-agnostic — it
  walks everything by suffix.
- Status colors (green / orange / red for success / warning / error) are
  deliberately left blue-free in the upstream and not remapped here. Don't add
  them to `mapping.json` unless you really want pink errors.
