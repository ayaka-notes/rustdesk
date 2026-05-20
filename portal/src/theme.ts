import { theme as antTheme, type ThemeConfig } from "antd";

// Pink palette mirrors the license-manager portal so the two pages feel like
// the same product family. Primary stays pink in both light and dark.
export function makeTheme(dark: boolean): ThemeConfig {
  return {
    algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: "#ff5c8a",
      colorInfo: "#ff5c8a",
      colorSuccess: "#7ed6a1",
      colorWarning: "#ffc987",
      colorError: "#ff4d6d",
      borderRadius: 12,
      fontFamily:
        '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      fontSize: 15,
      ...(dark
        ? {}
        : { colorBgLayout: "#fffafc", colorBorder: "#fbe7eb" }),
    },
    components: {
      Button: {
        primaryShadow: "0 4px 14px rgba(255,92,138,0.32)",
        controlHeight: 40,
      },
      Card: {
        headerBg: "transparent",
      },
      Segmented: {
        itemSelectedBg: "#ff5c8a",
        itemSelectedColor: "#fff",
        trackBg: dark ? "rgba(255,255,255,0.05)" : "rgba(255, 218, 228, 0.45)",
      },
    },
  };
}
