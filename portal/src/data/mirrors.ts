// Download-route options.
//
// Each mirror is a Chinese GitHub-acceleration proxy that works by *prefixing*
// the full github.com asset URL, i.e. the final link is:
//   <prefix>https://github.com/owner/repo/releases/download/tag/file
// so building a route URL is just `mirror.prefix + asset.url`.
//
// Verified 2026-05-20 against a real release asset — each route below returned
// HTTP 200 with `content-type: application/octet-stream` and the exact
// content-length of the upstream file (not an HTML landing page). The old
// `ghproxy.com` domain was dropped: it now serves an HTML page, not the binary.
//
// This space churns (FastGit died, ghproxy moved domains). If a route starts
// failing, re-verify with a HEAD request and swap it out here — no other file
// needs to change.

export type Mirror = {
  id: string;
  label: string;
  prefix: string; // prepended to the full https://github.com/... URL; "" = direct
  hint: string;
};

export const MIRRORS: Mirror[] = [
  {
    id: "direct",
    label: "GitHub 直连",
    prefix: "",
    hint: "直接从 github.com 下载;有海外网络 / 代理时最快",
  },
  {
    id: "gh-proxy-com",
    label: "镜像加速 · gh-proxy.com",
    prefix: "https://gh-proxy.com/",
    hint: "国内常用 GitHub 加速代理",
  },
  {
    id: "ghproxy-net",
    label: "镜像加速 · ghproxy.net",
    prefix: "https://ghproxy.net/",
    hint: "国内常用 GitHub 加速代理",
  },
  {
    id: "ghfast-top",
    label: "镜像加速 · ghfast.top",
    prefix: "https://ghfast.top/",
    hint: "多节点 GitHub 加速代理",
  },
  {
    id: "gh-ddlc-top",
    label: "镜像加速 · gh.ddlc.top",
    prefix: "https://gh.ddlc.top/",
    hint: "GitHub 加速代理",
  },
];

export const DEFAULT_MIRROR_ID = MIRRORS[0].id;
