// Static release manifest.
//
// Download URLs point at GitHub Release assets of the ayaka-notes/rustdesk
// fork. The asset filenames below are the *actual* names attached to the
// `ayaka-v1.4.7` release — verified against the GitHub API, not guessed.
// If you cut a new release, bump RELEASE_TAG / VERSION and re-check names
// (the upstream RustDesk CI names a few assets inconsistently, e.g. the
// macOS dmg carries a doubled arch suffix).

export type OsKey = "windows" | "macos" | "linux" | "android" | "ios";

export type Asset = {
  label: string;          // shown in the row's first column
  filename: string;       // shown small + monospace (also the GH asset name)
  arch: string;           // chip on the right side
  url: string;
  size?: string;          // human readable, e.g. "23.4 MB"
  notes?: string;         // small italic note under the filename
};

export type PlatformGroup = {
  os: OsKey;
  name: string;
  tagline: string;
  assets: Asset[];
};

export const VERSION = "1.4.7";

// GitHub Release this portal links to.
export const RELEASE_REPO = "ayaka-notes/rustdesk";
export const RELEASE_TAG = "ayaka-v1.4.7";
export const RELEASE_PAGE = `https://github.com/${RELEASE_REPO}/releases/tag/${RELEASE_TAG}`;

// Build a release-asset download URL from its exact attached filename.
const dl = (filename: string): string =>
  `https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}/${filename}`;

export const RELEASES: PlatformGroup[] = [
  {
    os: "windows",
    name: "Windows",
    tagline: "Windows 10 / 11 安装包或便携版",
    assets: [
      {
        label: "Installer (MSI)",
        filename: "rustdesk-1.4.7-x86_64.msi",
        arch: "x86_64",
        url: dl("rustdesk-1.4.7-x86_64.msi"),
        size: "23.4 MB",
        notes: "推荐:静默安装、自动启动后台服务",
      },
      {
        label: "Portable (EXE)",
        filename: "rustdesk-1.4.7-x86_64.exe",
        arch: "x86_64",
        url: dl("rustdesk-1.4.7-x86_64.exe"),
        size: "23.0 MB",
        notes: "免安装,适合临时 / U 盘场景",
      },
      {
        label: "32-bit (Sciter)",
        filename: "rustdesk-1.4.7-x86-sciter.exe",
        arch: "x86",
        url: dl("rustdesk-1.4.7-x86-sciter.exe"),
        size: "11.2 MB",
        notes: "老旧 32 位系统;使用旧版 Sciter 界面",
      },
    ],
  },
  {
    os: "macos",
    name: "macOS",
    tagline: "macOS 12 Monterey 及以上",
    assets: [
      {
        label: "Apple Silicon",
        filename: "rustdesk-1.4.7-aarch64-aarch64.dmg",
        arch: "aarch64",
        url: dl("rustdesk-1.4.7-aarch64-aarch64.dmg"),
        size: "24.9 MB",
        notes: "首次打开:右键 → 打开,允许未知开发者",
      },
      {
        label: "Intel",
        filename: "rustdesk-1.4.7-x86_64-x86_64.dmg",
        arch: "x86_64",
        url: dl("rustdesk-1.4.7-x86_64-x86_64.dmg"),
        size: "31.1 MB",
      },
    ],
  },
  {
    os: "linux",
    name: "Linux",
    tagline: "Ubuntu / Debian / Fedora / AppImage",
    assets: [
      {
        label: "Debian / Ubuntu (deb)",
        filename: "rustdesk-1.4.7-x86_64.deb",
        arch: "x86_64",
        url: dl("rustdesk-1.4.7-x86_64.deb"),
        size: "22.1 MB",
        notes: "sudo apt install ./rustdesk-1.4.7-x86_64.deb",
      },
      {
        label: "Debian / Ubuntu (ARM64)",
        filename: "rustdesk-1.4.7-aarch64.deb",
        arch: "aarch64",
        url: dl("rustdesk-1.4.7-aarch64.deb"),
        size: "20.5 MB",
      },
      {
        label: "Fedora / RHEL (rpm)",
        filename: "rustdesk-1.4.7-0.x86_64.rpm",
        arch: "x86_64",
        url: dl("rustdesk-1.4.7-0.x86_64.rpm"),
        size: "29.8 MB",
      },
      {
        label: "AppImage (通用)",
        filename: "rustdesk-1.4.7-x86_64.AppImage",
        arch: "x86_64",
        url: dl("rustdesk-1.4.7-x86_64.AppImage"),
        size: "81.4 MB",
        notes: "chmod +x 后直接运行,免发行版依赖",
      },
    ],
  },
  {
    os: "android",
    name: "Android",
    tagline: "Android 7.0 及以上",
    assets: [
      {
        label: "Universal APK",
        filename: "rustdesk-1.4.7-universal.apk",
        arch: "universal",
        url: dl("rustdesk-1.4.7-universal.apk"),
        size: "67.6 MB",
        notes: "包含多种架构,体积稍大但兼容性最好",
      },
      {
        label: "ARM64 APK",
        filename: "rustdesk-1.4.7-aarch64.apk",
        arch: "aarch64",
        url: dl("rustdesk-1.4.7-aarch64.apk"),
        size: "25.4 MB",
      },
    ],
  },
  {
    os: "ios",
    name: "iOS",
    tagline: "iOS 14 及以上 — 暂未上架 App Store",
    assets: [
      {
        label: "IPA(未签名,需自签)",
        filename: "rustdesk-1.4.7-unsigned.ipa",
        arch: "aarch64",
        url: dl("rustdesk-1.4.7-unsigned.ipa"),
        size: "22.9 MB",
        notes: "需要使用 AltStore / Sideloadly 等工具自签安装",
      },
    ],
  },
];
