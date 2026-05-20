import { useState } from "react";
import { Alert, Button, Space, Typography, message } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import type { OsKey } from "@/data/releases";

const { Text, Paragraph } = Typography;

// ---------- Copy-to-clipboard code block ----------

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      message.error("复制失败,请手动选中");
    }
  };
  return (
    <div
      style={{
        position: "relative",
        background: "rgba(40, 24, 32, 0.92)",
        color: "#ffd5e1",
        padding: "12px 44px 12px 14px",
        borderRadius: 10,
        fontFamily:
          "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.65,
        whiteSpace: "pre",
        overflowX: "auto",
      }}
    >
      <Button
        size="small"
        type="text"
        onClick={copy}
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          fontSize: 12,
          color: copied ? "#7ed6a1" : "#ffb8cc",
        }}
      >
        {copied ? "已复制" : "复制"}
      </Button>
      {code}
    </div>
  );
}

// ---------- Per-OS guides ----------

function MacosGuide() {
  return (
    <>
      <Paragraph style={{ marginBottom: 8 }}>
        macOS 默认会拦截未经 Apple 公证的应用,首次打开会提示&nbsp;
        <Text code>"RustDesk" is damaged and can't be opened</Text>{" "}
        或弹出"无法验证开发者"的对话框。在终端执行下面两行就能解除:
      </Paragraph>
      <CodeBlock
        code={`sudo xattr -dr com.apple.quarantine /Applications/RustDesk.app
sudo codesign --force --deep --sign - /Applications/RustDesk.app`}
      />
      <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
        第一条移除 quarantine 属性,第二条用本机临时签名重新打签。<br />
        执行完直接双击图标打开,以后不会再弹警告。如果换了新版,
        <Text strong style={{ fontSize: 12 }}>重新装好 dmg 后需要再跑一次</Text>。
      </Paragraph>
    </>
  );
}

function LinuxGuide() {
  return (
    <>
      <Paragraph style={{ marginBottom: 8 }}>Debian / Ubuntu:</Paragraph>
      <CodeBlock
        code={`sudo apt install ./rustdesk-1.4.6-x86_64.deb
# 装完会自动注册 systemd 服务,开机自启`}
      />
      <Paragraph style={{ marginTop: 12, marginBottom: 8 }}>Fedora / RHEL / openSUSE:</Paragraph>
      <CodeBlock
        code={`sudo dnf install ./rustdesk-1.4.6-x86_64.rpm
# 或 sudo zypper install`}
      />
      <Paragraph style={{ marginTop: 12, marginBottom: 8 }}>AppImage(免发行版依赖):</Paragraph>
      <CodeBlock
        code={`chmod +x rustdesk-1.4.6-x86_64.AppImage
./rustdesk-1.4.6-x86_64.AppImage`}
      />
    </>
  );
}

function WindowsGuide() {
  return (
    <Paragraph style={{ marginBottom: 0 }}>
      MSI 双击安装,会自动注册 Windows 服务实现关机后远程唤醒。<br />
      Portable 版直接双击 exe 即可,适合临时使用,
      <Text strong>关闭后无法被远程控制</Text>。<br />
      首次启动 Windows Defender / SmartScreen 可能拦截,点&nbsp;
      <Text code>更多信息 → 仍要运行</Text> 即可。
    </Paragraph>
  );
}

function AndroidGuide() {
  return (
    <Paragraph style={{ marginBottom: 0 }}>
      下载 APK 后直接点击安装即可。<br />
      首次提示"未知来源",在&nbsp;
      <Text code>设置 → 应用 → 特殊权限 → 安装未知应用</Text>&nbsp;
      给浏览器或文件管理器开通权限后重试。<br />
      被控端需要开启&nbsp;
      <Text code>无障碍服务</Text>&nbsp;
      和&nbsp;
      <Text code>悬浮窗</Text>&nbsp;权限。
    </Paragraph>
  );
}

function IosGuide() {
  return (
    <Paragraph style={{ marginBottom: 0 }}>
      iOS 没上架 App Store,需要&nbsp;<Text strong>侧载</Text>:<br />
      ① 用 AltStore / Sideloadly / 巨魔商店等工具安装 IPA;<br />
      ② 在&nbsp;
      <Text code>设置 → 通用 → VPN与设备管理</Text>&nbsp;
      信任开发者证书;<br />
      ③ 普通侧载证书 7 天失效,需要每周重新签;企业证书或开发者账号签名时效更长。
    </Paragraph>
  );
}

const GUIDES: Record<OsKey, { title: string; type: "info" | "warning"; body: JSX.Element }> = {
  macos: { title: "macOS 首次启动:解除签名拦截", type: "warning", body: <MacosGuide /> },
  linux: { title: "Linux 安装命令", type: "info", body: <LinuxGuide /> },
  windows: { title: "Windows 安装提示", type: "info", body: <WindowsGuide /> },
  android: { title: "Android 安装提示", type: "info", body: <AndroidGuide /> },
  ios: { title: "iOS 侧载步骤", type: "warning", body: <IosGuide /> },
};

export function InstallNotes({ os }: { os: OsKey }) {
  const g = GUIDES[os];
  return (
    <Alert
      type={g.type}
      showIcon
      style={{
        borderRadius: 14,
        background: g.type === "warning"
          ? "rgba(255, 234, 222, 0.65)"
          : "rgba(255, 240, 246, 0.65)",
        border: `1px solid ${g.type === "warning" ? "rgba(255, 180, 130, 0.5)" : "rgba(255, 180, 200, 0.5)"}`,
      }}
      message={<Text strong style={{ fontSize: 14.5 }}>{g.title}</Text>}
      description={
        <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 6 }}>
          {g.body}
        </Space>
      }
    />
  );
}
