import {
  AppleOutlined,
  AndroidOutlined,
  WindowsOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { OsKey } from "@/data/releases";

// Inline Linux glyph — antd doesn't ship one. Penguin-ish abstraction.
function LinuxGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden>
      <path d="M12 2c-2.2 0-3.5 1.7-3.5 4.2 0 .9.2 1.7.5 2.4-.7.6-1.3 1.4-1.7 2.4-.6 1.5-1.4 2.9-2.3 4-.9 1.1-1 2.4-.3 3.5.6 1 1.6 1.5 2.6 1.5 1 .5 2.2.8 3.4 1l1 .5c.6.3 1.3.5 2.1.5h.5c.8 0 1.5-.2 2.1-.5l1-.5c1.2-.2 2.4-.5 3.4-1 1 0 2-.5 2.6-1.5.7-1.1.6-2.4-.3-3.5-.9-1.1-1.7-2.5-2.3-4-.4-1-1-1.8-1.7-2.4.3-.7.5-1.5.5-2.4C15.5 3.7 14.2 2 12 2zm-1.8 5.6c.3 0 .6.4.6.9s-.3.9-.6.9c-.3 0-.6-.4-.6-.9s.3-.9.6-.9zm3.6 0c.3 0 .6.4.6.9s-.3.9-.6.9c-.3 0-.6-.4-.6-.9s.3-.9.6-.9zM12 11c.9 0 1.6.6 1.6 1.3 0 .4-.3.7-.7.7-.2 0-.3-.1-.4-.2-.1-.1-.3-.2-.5-.2s-.4.1-.5.2c-.1.1-.3.2-.4.2-.4 0-.7-.3-.7-.7 0-.7.7-1.3 1.6-1.3z" />
    </svg>
  );
}

export const OS_ICONS: Record<OsKey, JSX.Element> = {
  windows: <WindowsOutlined />,
  macos: <AppleOutlined />,
  linux: <LinuxGlyph />,
  android: <AndroidOutlined />,
  ios: <AppstoreOutlined />,
};

export function OsIcon({ os, size = 22 }: { os: OsKey; size?: number }) {
  return (
    <span style={{ fontSize: size, color: "#ff5c8a", display: "inline-flex" }}>
      {OS_ICONS[os]}
    </span>
  );
}
