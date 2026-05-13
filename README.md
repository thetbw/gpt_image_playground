# GPT Image Playground

基于 OpenAI 图像生成接口的图片生成与编辑工具。提供简洁精美的 Web UI，支持文本生图、参考图与遮罩编辑，数据纯本地化存储，带来流畅的历史记录与参数管理体验。

> 若需调用非 HTTPS 的内网或本地 HTTP API，请使用 GitHub Pages 版本或自行部署，Vercel 部署的体验版绑定的 `.dev` 域名因安全策略通常要求接口必须为 HTTPS。

[**🌐 Vercel 在线体验**](https://gpt-image-playground.cooksleep.dev) &nbsp;|&nbsp; [**🌐 GitHub Pages 在线体验**](https://cooksleep.github.io/gpt_image_playground)

---

## 📸 界面预览

<details>
<summary><b>点击展开截图展示</b></summary>
<br>

<div align="center">
  <b>桌面端主界面</b><br>
  <img src="docs/images/example_pc_1.png" alt="桌面端主界面" />
</div>

<br>

<div align="center">
  <b>任务详情与实际参数</b><br>
  <img src="docs/images/example_pc_2.png" alt="任务详情与实际参数" />
</div>

<br>

<div align="center">
  <b>桌面端批量选择</b><br>
  <img src="docs/images/example_pc_3.png" alt="桌面端批量选择" />
</div>

<br>

<div align="center">
  <b>移动端主界面</b><br>
  <img src="docs/images/example_mb_1.jpg" alt="移动端主界面" width="420" />
</div>

<br>

<div align="center">
  <b>移动端侧滑多选</b><br>
  <img src="docs/images/example_mb_2.jpg" alt="移动端侧滑多选" width="420" />
</div>

</details>

---

## ✨ 核心特性

### 🎨 强大的图像生成与编辑
- **双模接口支持**：自由切换使用常规 `Images API` (`/v1/images`) 或 `Responses API` (`/v1/responses`)。
- **参考图与遮罩**：支持上传最多 16 张参考图（支持剪贴板和拖拽）。内置可视化遮罩编辑器，自动预处理以符合官方分辨率限制。
- **批量与迭代**：支持单次多图生成；一键将满意结果转为参考图，无缝开启下一轮修改。

### ⚙️ 精细化参数追踪
- **智能尺寸控制**：提供 1K/2K/4K 快速预设，自定义宽高时会自动规整至模型安全范围（16 的倍数、总像素校验等）。
- **实际参数对比**：自动提取 API 响应中真实生效的尺寸、质量、耗时以及**模型改写后的提示词**，与你的请求参数高亮对比。

### 📁 高效历史管理 (纯本地)
- **瀑布流与画廊**：历史任务自动保存，支持按状态过滤、全屏大图预览与快捷下载。
- **快捷批量操作**：桌面端支持鼠标拖拽框选、Ctrl/⌘ 连选，移动端支持顺滑侧滑多选；轻松实现批量收藏与清理。
- **极致性能与隐私**：所有记录与图片均存放在浏览器 IndexedDB 中（采用 SHA-256 去重压缩），不经过任何第三方服务器。支持一键打包导出 ZIP 备份。

### 🔌 API 兼容增强
- **Codex CLI 兼容模式**：专为非标准 API (如 Codex CLI) 打造。开启后自动固定无效参数，将 Images API 的多图请求拆分为并发单图。
- **提示词防改写**：Responses API 会始终在请求文本前加入强制指令防止提示词被改写；开启 Codex CLI 模式后，Images API 也会获得同等保护。

---

## 🚀 部署与使用

支持多种部署与开发方式。无论使用哪种方式，你都可以预设默认的 API 节点。

<details>
<summary><strong>▲ 方式一：Vercel 一键部署 (推荐)</strong></summary>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCookSleep%2Fgpt_image_playground&project-name=gpt-image-playground&repository-name=gpt-image-playground)

点击上方按钮导入仓库即可，Vercel 会自动执行构建并部署静态文件。

**配置默认 API URL**：在 Vercel 项目的 **Settings → Environment Variables** 中添加 `VITE_DEFAULT_API_URL`（如 `https://api.openai.com/v1`），然后重新部署即可生效。

**配置自动更新**：

本项目已在 `vercel.json` 中关闭了默认的自动部署。若需在同步 GitHub 上游代码后自动更新 Vercel 部署：

1. 在 Vercel 项目设置 **Settings -> Git** 的 **Deploy Hooks** 中创建一个名为 `Release` 的 Hook（Branch 填 `main`）并复制生成的 URL。
2. 在你 Fork 的 GitHub 仓库设置 **Settings -> Secrets and variables -> Actions** 中，新建 Secret `VERCEL_DEPLOY_HOOK`，填入刚才的 URL。

此后，每次在 GitHub 点击 **Sync fork** 同步上游，都会自动触发 Vercel 构建部署最新版。

</details>

<details>
<summary><strong>🐳 方式二：Docker 部署</strong></summary>

官方镜像已发布至 GitHub Container Registry。Docker 部署支持在运行时注入默认配置。

**环境变量说明：**

- `DEFAULT_API_URL`：设置页面上默认显示的 API 地址。
- `API_PROXY_URL`：配置内置代理实际转发到的目标 API 地址（仅开启代理时有效）。
- `ENABLE_API_PROXY`：设为 `true` 开启容器内置 Nginx 同源代理，用于解决浏览器跨域（CORS）限制。开启后，浏览器将请求同源的 `/api-proxy/`，再由 Nginx 转发至 `API_PROXY_URL`。
- `HOST` / `PORT`：指定容器内 Nginx 监听的地址和端口（默认 `0.0.0.0:80`）。

> ⚠️ **安全警告**：开启 API 代理后，任何人都能将你的服务器作为代理来请求目标 API。建议仅在有访问控制（如 IP 白名单）或本地网络中开启。

> 💡 **兼容迁移**：旧版本中的 `API_URL` 已拆分为 `DEFAULT_API_URL` 和 `API_PROXY_URL`。容器启动时会自动将遗留的 `API_URL` 作为两个新变量的兜底值，实现无缝兼容。建议更新配置文件，逐步迁移至新变量。

**1. Docker CLI 示例**

```bash
docker run -d -p 8080:80 \
  -e DEFAULT_API_URL=https://api.openai.com/v1 \
  -e ENABLE_API_PROXY=true \
  -e API_PROXY_URL=https://api.openai.com/v1 \
  ghcr.io/cooksleep/gpt_image_playground:latest
```

*(注：使用 host 网络时加 `--network host`，修改容器监听端口使用 `-e PORT=28080`)*

**2. Docker Compose 示例**

```yaml
services:
  gpt-image-playground:
    image: ghcr.io/cooksleep/gpt_image_playground:latest
    environment:
      - DEFAULT_API_URL=https://api.openai.com/v1
    ports:
      - "8080:80"
    restart: unless-stopped
```

浏览器访问 `http://localhost:8080`，可在页面右上角设置中填写 API URL / API Key（若未启用受管模式）。

如果你的 API 节点没有放开浏览器跨域，可以用环境变量 `ENABLE_API_PROXY=true` 开启容器内 Nginx 代理。开启后，设置面板才会展示 **API 代理** 开关；用户启用该开关后，浏览器会请求同源的 `/api-proxy/`，由容器内 Nginx 转发到部署端配置的 `API_PROXY_URL`。

### 受管模式（Managed Mode）

支持以下可选环境变量：

- `MANAGED_API_URL`：托管前端的 API URL 设置。
- `MANAGED_API_KEY`：托管服务端 API Key（不会注入前端 JS）。
- `MANAGED_CODEX_CLI`：托管 Codex CLI 模式开关。
- `MANAGED_API_MODE`：托管 API 模式（`images`/`responses`）。

当上述字段被托管时：
- 前端对应设置项会显示“由部署端托管，不可编辑”并禁用。
- URL 查询参数对对应字段的覆盖会被禁用。
- 若配置了 `MANAGED_API_KEY`，前端请求应走同源 `/api-proxy/`，由 Nginx 注入 `Authorization: Bearer ...` 后再转发到上游 API；密钥不会进入浏览器可读配置或构建产物。

⚠️ **安全警告**：开启 `ENABLE_API_PROXY=true` 后，任何人都能将你的服务器作为代理来请求目标 API。虽然请求本身仍需携带有效的 API Key 才能成功，但这可能会消耗你的服务器带宽。如果目标 API 是内网服务或基于 IP 白名单免密访问，则存在被未经授权调用的风险。建议仅在本地开发或有访问控制（如 IP 白名单、前置认证机制等）的环境中开启此功能。

如果使用 bridge 网络并修改了容器内 `PORT`，需要同步调整端口映射，例如 `PORT=28080` 时使用 `"8080:28080"`。使用 host 网络时不要配置 `ports`。

### 挂载目录公告（`/announcements-src`）

容器支持从挂载目录自动读取公告 Markdown 文件。启动时会扫描容器内的 `/announcements-src`，按文件名倒序生成 `/announcements/index.json`，并把 `.md` 与同目录资源文件一起同步到静态目录中。

- 只识别公告目录根层级的 `*.md` 文件，不递归扫描子目录。
- 建议文件名使用 `YYYY-MM-DD-name.md` 或 `YYYY-MM-DD_name.md`，例如 `2026-05-05-release.md`。
- 页面会自动弹出最新一条公告，并在右上角保留公告入口，可查看历史公告。
- Markdown 标题优先取正文第一行一级标题 `# 标题`；若没有，则回退到文件名。

目录示例：

```text
announcements/
  2026-05-05-release.md
  2026-05-05-cover.png
  2026-04-20-hotfix.md
```

`2026-05-05-release.md` 中可直接使用相对路径引用图片：

```md
# 五一版本公告

![封面](2026-05-05-cover.png)

- 新增挂载目录式公告系统
- 支持自动弹窗和历史公告查看
```

**Docker CLI：**

```bash
docker run -d -p 8080:80 \
  -e DEFAULT_API_URL=https://api.openai.com/v1 \
  -e API_PROXY_URL=https://api.openai.com/v1 \
  -v "$(pwd)/announcements:/announcements-src:ro" \
  ghcr.io/cooksleep/gpt_image_playground:latest
```

**Docker Compose：**

```yaml
services:
  gpt-image-playground:
    image: ghcr.io/cooksleep/gpt_image_playground:latest
    environment:
      - DEFAULT_API_URL=https://api.openai.com/v1
      - API_PROXY_URL=https://api.openai.com/v1
    volumes:
      - ./announcements:/announcements-src:ro
    ports:
      - "8080:80"
    restart: unless-stopped
```

修改公告目录内容后，重启容器即可生效。


### 访问门禁（`ACCESS_PASSWORD`）

可通过 `ACCESS_PASSWORD` 为容器增加一个轻量访问门禁。前端会先调用同源 `POST /auth/verify` 校验密码，密码只在服务端环境变量中保存，不会注入前端 JS 包。

如果还希望在门禁弹窗标题后追加一段公开提示，可额外设置 `ACCESS_PASSWORD_TITLE_HINT`。例如设置为 `内网使用` 后，标题会显示为 `访问验证（内网使用）`。

```bash
docker run -d -p 8080:80 \
  -e DEFAULT_API_URL=https://api.openai.com/v1 \
  -e API_PROXY_URL=https://api.openai.com/v1 \
  -e ACCESS_PASSWORD='your-strong-password' \
  -e ACCESS_PASSWORD_TITLE_HINT='内网使用' \
  ghcr.io/cooksleep/gpt_image_playground:latest
```

- 忘记密码时，直接修改容器环境变量并重启容器即可生效。
- 前端不会缓存访问密码；刷新页面、重新打开页面，或服务端密码变更后，都需要重新输入。
- `ACCESS_PASSWORD_TITLE_HINT` 仅用于前端展示，会进入运行时 `runtime-config.js`，请不要填写敏感信息。
- 建议在公网部署时强制 HTTPS，避免密码明文传输。
- 建议在前置反向代理层（如 Nginx/Traefik/Cloudflare）增加限流、失败次数控制与封禁策略，降低暴力尝试风险。

*(注：官方镜像同时提供带版本号的标签，如 `0.1.11` 或 `0.1`)*

**更新说明：**

使用 `latest` 标签时，重新拉取镜像并重启即可更新（如 `docker compose pull && docker compose up -d`）。若需固定版本可使用官方提供的版本号标签（如 `0.2.x`）。

</details>

<details>
<summary><strong>💻 方式三：本地开发与静态构建</strong></summary>

**1. 环境准备与启动**

你可以在项目根目录新建 `.env.local` 文件配置默认 API URL（如 `VITE_DEFAULT_API_URL=https://api.openai.com/v1`）。然后安装依赖并启动：

```bash
npm install
npm run dev
```

**2. 本地开发跨域代理 (可选)**

如果在本地开发时遇到浏览器的 CORS 限制，可开启本地代理转发：

```bash
cp dev-proxy.config.example.json dev-proxy.config.json
```

修改 `dev-proxy.config.json`，将 `target` 设置为真实的图片接口地址。重启开发服务器后，在页面设置中开启 **API 代理** 即可（请求将被转发如 `http://localhost:5173/api-proxy/... -> target/...`）。此功能仅在 `npm run dev` 阶段生效，不会影响打包产物。

**3. 构建静态产物**

```bash
npm run build
```

构建输出的文件位于 `dist/` 目录下，可将其部署至任何静态文件服务器（如普通 Nginx、GitHub Pages、Netlify 等）。

</details>

---

## 🛠️ API 配置与 URL 传参

点击页面右上角的 **设置 (⚙️)**，可以配置模型、密钥与其他参数。

- **双接口模式**：支持 `Images API` (需填写 GPT Image 模型，如 `gpt-image-2`) 和 `Responses API` (需填写支持该工具的文本模型，如 `gpt-5.5`)。
- **API 代理**：开启后，浏览器将请求同源的 `/api-proxy/` 路径，交由当前部署环境（Docker 或 本地开发）代理转发至真实 API，以绕开浏览器 CORS 限制。
- **Codex CLI 模式**：如果你在使用源于 Codex CLI 的 API，可以在 `API URL` 右侧开启该模式。开启后会禁用不支持的 `quality` 参数，Images API 的多图生成也将改为并发单图请求。此外，提示词文本开头会加入简短的防改写指令，防止模型偏离原意。（注：Responses API 无论是否开启此模式，都会默认加入防改写指令）。
- **智能诊断提示**：当应用检测到接口返回的提示词被强制改写，或缺少官方 API 常规返回的参数时，会主动提示你是否针对当前配置组合开启 Codex CLI 模式。

### URL 传参快速填充

应用支持通过 URL 查询参数快速填入配置，非常适合创建书签或集成分享：

应用支持通过 URL 查询参数快速填充**非受管字段**配置：

- `?apiUrl=https://你的代理地址.com`
- `?apiKey=sk-xxxx`
- `?apiMode=images` 或 `?apiMode=responses`（未传时默认为 `images`）
- `?codexCli=true` 或 `?codexCli=false`，未传时默认关闭，仅 `true` 会开启 Codex CLI 模式
- `?provider=openai` 或 `?provider=fal`

例如，集成到 New API 的聊天系统：

```text
https://gpt-image-playground.cooksleep.dev?apiUrl={address}&apiKey={key}
```

```text
https://cooksleep.github.io/gpt_image_playground?apiUrl={address}&apiKey={key}
```

---

## 💻 技术栈

- **前端框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite](https://vite.dev/)
- **样式方案**：[Tailwind CSS 3](https://tailwindcss.com/)
- **状态管理**：[Zustand](https://zustand.docs.pmnd.rs/)

## 📄 许可证 & 致谢

本项目基于 [MIT License](LICENSE) 开源。

特别致谢：[LINUX DO](https://linux.do)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CookSleep/gpt_image_playground&type=Date)](https://www.star-history.com/#CookSleep/gpt_image_playground&Date)
