import { Button, Tooltip } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { Asset, OsKey } from "@/data/releases";
import { OsIcon } from "@/components/OsIcon";

export function DownloadRow({
  asset,
  os,
  urlPrefix,
}: {
  asset: Asset;
  os: OsKey;
  urlPrefix: string;
}) {
  return (
    <div className="dl-row">
      <div className="dl-icon">
        <OsIcon os={os} size={28} />
      </div>
      <div className="dl-meta">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 15 }}>{asset.label}</strong>
          <span className="pink-chip">{asset.arch}</span>
          {asset.size && (
            <span style={{ fontSize: 12, opacity: 0.6 }}>{asset.size}</span>
          )}
        </div>
        <span className="dl-fname">{asset.filename}</span>
        {asset.notes && (
          <span style={{ fontSize: 12, opacity: 0.7, fontStyle: "italic" }}>
            {asset.notes}
          </span>
        )}
      </div>
      <Tooltip title={`下载 ${asset.filename}`}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          href={urlPrefix + asset.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          下载
        </Button>
      </Tooltip>
    </div>
  );
}
