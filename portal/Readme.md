# RustDesk Download Portal

粉色风格的下载门户站,自动按用户系统推荐对应的安装包。React + Ant Design,
Docker 一键部署。

## 开发

```bash
npm install
npm run dev   # http://localhost:5173
```

## Docker 部署

```bash
# 1. 把安装包放进 ./downloads/
#    比如 rustdesk-1.4.6-x86_64.deb / rustdesk-1.4.6-aarch64.dmg / ...
#    文件名必须和 src/data/releases.ts 里的对得上。

# 2. 起服务
docker compose up -d --build

# 3. 浏览器打开 http://localhost:8080
```

## 改安装包列表

两种方式任选一种:

**方式 A:改源码后重新 build**
编辑 `src/data/releases.ts`,改完 `docker compose up -d --build`。

**方式 B:不重新 build,通过 `releases.json` 热更新(预留接口)**
把 `releases.json` 放到 `./downloads/releases.json`,nginx 会在
`/releases.json` 暴露它。前端目前还没实现 fetch 这个 endpoint —
demo 阶段先用方式 A,要无重启更新时再扩展 `App.tsx`。

## 自定义品牌

- 替换 `public/logo.svg`
- 调整 `src/theme.ts` 里的色板(主色 `#ff5c8a`,改一处即可)
- 改 `index.html` 的标题
- 修改 `src/App.tsx` hero 文案

## 目录结构

```
RustDesk-Download/
├── Dockerfile          # Vite build + nginx 双阶段
├── docker-compose.yml  # 一键部署
├── nginx/default.conf  # SPA + /downloads/ 路由
├── downloads/          # 安装包挂载点(运行时挂入容器)
├── public/logo.svg     # 站点图标
└── src/
    ├── App.tsx                # 主页面
    ├── theme.ts               # AntD 粉色主题
    ├── styles.css             # 渐变背景 / 玻璃卡片
    ├── data/releases.ts       # 版本与安装包清单
    └── components/
        ├── OsTile.tsx         # OS 选择卡片
        └── DownloadRow.tsx    # 单个下载条目
```
