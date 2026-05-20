import { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Typography,
  Space,
  Row,
  Col,
  Card,
  Tag,
  Tooltip,
  Button,
  Select,
} from "antd";
import { TagOutlined, LoginOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { OsTile } from "@/components/OsTile";
import { DownloadRow } from "@/components/DownloadRow";
import { InstallNotes } from "@/components/InstallNotes";
import { RELEASES, VERSION, type OsKey } from "@/data/releases";
import { MIRRORS, DEFAULT_MIRROR_ID } from "@/data/mirrors";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

// Vite's configured base ("/" for Docker, "/rustdesk/" for GitHub Pages).
// Asset paths in JSX must be prefixed with this — Vite only rewrites
// root-absolute URLs inside index.html, not string literals in components.
const BASE = import.meta.env.BASE_URL;

// Best-guess UA detection so the tile for the user's OS opens by default.
function detectOs(): OsKey {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "ios";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

export default function App() {
  const [active, setActive] = useState<OsKey>("windows");
  const [mirrorId, setMirrorId] = useState<string>(DEFAULT_MIRROR_ID);

  useEffect(() => {
    setActive(detectOs());
  }, []);

  const group = useMemo(
    () => RELEASES.find((g) => g.os === active) ?? RELEASES[0],
    [active],
  );

  const mirror = useMemo(
    () => MIRRORS.find((m) => m.id === mirrorId) ?? MIRRORS[0],
    [mirrorId],
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 32px",
          height: 64,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 30,
              height: 30,
              boxSizing: "border-box",
              borderRadius: "50%",
              border: "1.5px solid rgba(255, 140, 170, 0.45)",
              background: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 7px rgba(255, 140, 170, 0.22)",
            }}
          >
            <img src={`${BASE}logo.svg`} width={17} height={17} alt="RustDesk" />
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              opacity: 0.32,
              userSelect: "none",
            }}
          >
            ×
          </span>
          <span
            style={{
              width: 30,
              height: 30,
              boxSizing: "border-box",
              borderRadius: "50%",
              border: "1.5px solid rgba(255, 140, 170, 0.45)",
              overflow: "hidden",
              display: "inline-flex",
              boxShadow: "0 2px 7px rgba(255, 140, 170, 0.22)",
            }}
          >
            <img
              src={`${BASE}avatar.png`}
              alt="ayaka-notes"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
          <span
            className="gradient-text"
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: -0.1,
              fontFamily:
                '"Inter", "SF Pro Display", -apple-system, system-ui, sans-serif',
            }}
          >
            RustDesk
          </span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 400,
              opacity: 0.55,
              letterSpacing: 0.3,
              fontFamily:
                "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
            }}
          >
            ayaka-notes
          </span>
        </span>

        <Button
          type="primary"
          icon={<LoginOutlined />}
          href="https://remote.ayaka.space"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "auto", fontWeight: 600, height: 35 }}
        >
          Login
        </Button>
      </Header>

      <Content style={{ position: "relative" }}>
        <div className="hero-bg" />

        {/* ---------- COMPACT TITLE ---------- */}
        <section
          style={{
            position: "relative",
            padding: "48px 24px 24px",
            textAlign: "center",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          <img
            src={`${BASE}logo.svg`}
            width={84}
            height={84}
            alt=""
            style={{ marginBottom: 18, filter: "drop-shadow(0 8px 24px rgba(255, 140, 170, 0.35))" }}
          />
          <div>
            <Text
              className="gradient-text"
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              RustDesk 客户端下载
            </Text>
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <span className="invite-banner">
              <TagOutlined style={{ fontSize: 14 }} />
              <span style={{ fontWeight: 600 }}>v{VERSION}</span>
              <span className="invite-divider" />
              <span style={{ opacity: 0.78 }}>
                由{" "}
                <span
                  style={{
                    fontFamily:
                      "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
                    fontSize: 12.5,
                    letterSpacing: 0.2,
                  }}
                >
                  ayaka-notes
                </span>{" "}
                构建
              </span>
            </span>
          </div>
        </section>

        {/* ---------- OS PICKER (centered) ---------- */}
        <section
          style={{
            position: "relative",
            maxWidth: 1080,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <Row gutter={[16, 16]} justify="center" align="stretch">
            {RELEASES.map((g) => (
              <Col key={g.os} xs={12} sm={8} md={4} lg={4} style={{ display: "flex" }}>
                <OsTile
                  os={g.os}
                  name={g.name}
                  tagline={g.tagline}
                  selected={active === g.os}
                  onSelect={() => setActive(g.os)}
                />
              </Col>
            ))}
          </Row>
        </section>

        {/* ---------- DOWNLOAD LIST ---------- */}
        <section
          style={{
            position: "relative",
            maxWidth: 1080,
            margin: "28px auto 0",
            padding: "0 24px",
          }}
        >
          <Card
            className="frost-card"
            title={
              <Space size="middle">
                <span style={{ fontSize: 17, fontWeight: 600 }}>{group.name}</span>
                <Tag color="pink" style={{ borderRadius: 8 }}>
                  {group.assets.length} 个安装包
                </Tag>
              </Space>
            }
            extra={
              <Space size={6}>
                <Tooltip title="GitHub 下载慢?切换到国内镜像加速线路">
                  <ThunderboltOutlined style={{ opacity: 0.5, fontSize: 13 }} />
                </Tooltip>
                <Select
                  value={mirrorId}
                  onChange={setMirrorId}
                  style={{ width: 188 }}
                  options={MIRRORS.map((m) => ({
                    value: m.id,
                    label: m.label,
                  }))}
                />
              </Space>
            }
          >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {group.assets.map((a) => (
                <DownloadRow
                  key={a.filename}
                  asset={a}
                  os={group.os}
                  urlPrefix={mirror.prefix}
                />
              ))}
            </Space>
          </Card>
        </section>

        {/* ---------- INSTALL NOTES ---------- */}
        <section
          style={{
            position: "relative",
            maxWidth: 1080,
            margin: "16px auto 0",
            padding: "0 24px",
          }}
        >
          <InstallNotes os={active} />
        </section>
      </Content>

      <Footer
        style={{
          textAlign: "center",
          padding: "32px 24px 28px",
          marginTop: 40,
        }}
      >
        <Space direction="vertical" size={4}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            基于上游 RustDesk{" "}
            <Tooltip title="GPL-3.0">
              <a
                href="https://github.com/rustdesk/rustdesk"
                target="_blank"
                rel="noreferrer"
              >
                开源
              </a>
            </Tooltip>{" "}
            构建 · 仅限内部使用
          </Text>
          <Text type="secondary" style={{ fontSize: 12, opacity: 0.7 }}>
            © {new Date().getFullYear()} Ayaka-notes. All rights reserved.
          </Text>
        </Space>
      </Footer>
    </Layout>
  );
}
