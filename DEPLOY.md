# 部署到 Cloudflare Pages（含后端鉴权）

目标：把站点搬到 **Cloudflare Pages**，并用 **Pages Functions** 做后端鉴权 ——
管理口令与 GitHub Token **都只存在 Cloudflare 的加密环境变量里**，不进浏览器、不进仓库。
静态站与后端同域名（`*.pages.dev`），无需处理跨域。

> **费用：$0**。Pages 免费版静态资源不限流量、500 次构建/月；Functions 免费 10 万次请求/天。
> 本站只在管理时才会请求后端，访客不碰它，用量远低于免费额度。无需绑卡。

---

## 一、创建 Pages 项目（约 2 分钟）

1. 注册 / 登录 [dash.cloudflare.com](https://dash.cloudflare.com)（免费）
2. 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选择仓库 `HiEq/HOME`，构建设置保持默认即可：
   | 项 | 值 |
   | --- | --- |
   | Framework preset | None |
   | Build command | （留空） |
   | Build output directory | `/` |
4. **Save and Deploy** —— 之后每次 push 到 `main` 都会自动重新部署

`functions/` 目录会被自动识别为 Pages Functions，无需任何额外配置。

> 想让 GitHub Pages 继续可用也完全可以：没有后端时前端会自动退回「本地哈希 + 本机 Token」模式。

---

## 二、配置环境变量（安全的关键）

在项目 **Settings → Environment variables** 里添加（Production + Preview 都加）：

| 变量名 | 值 | 类型 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 你的管理口令（建议长随机） | **Secret** |
| `SESSION_SECRET` | 随机长串，如 `openssl rand -hex 32` 生成 | **Secret** |
| `GITHUB_TOKEN` | 仅勾选 `Contents: Read and write` 的 Fine-grained PAT（只授权本仓库） | **Secret** |
| `GH_REPO` | `HiEq/HOME` | Text |

改完点一次 **Retry deployment**（或随便推一个提交）让它生效。

**权限最小化**：PAT 只给 `Contents: Read and write`、范围只选 `HiEq/HOME` 这一个仓库。
这样即使任何一端出问题，损失也被限制在这个仓库的内容写入上。

---

## 三、改口令

直接在 Cloudflare 控制台改 `ADMIN_PASSWORD` 即可，**不需要改代码**。

> 注意：口令只在服务端比对，`gallery.json` 里的 `adminHash` 只是无后端场景的兜底，
> 两者可以不同（以服务端为准）。

---

## 四、可选：绑定自己的域名

Pages 项目 → **Custom domains** → 添加域名，按提示把 CNAME 指到 Cloudflare 即可。
用 `xxx.pages.dev` 免费子域名也完全够用。

---

## 五、接口一览

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/login` | POST `{password}` | 校验口令 → 返回 12 小时会话凭证（HMAC 签名） |
| `/api/gh` | POST `{method,path,body}` | 带会话凭证代理 GitHub Contents API；仓库固定在服务端 |

两个接口都做了定长比较 / 路径白名单 / 方法白名单；会话过期返回 401，前端会自动退回本地模式。

---

## 六、常见问题

**Q：改了环境变量没生效？**
A：环境变量在部署时注入，去 Deployments 里点 **Retry deployment**。

**Q：上传图片报 401？**
A：会话过期了（12 小时），重新登录即可；若一直 401，检查 `ADMIN_PASSWORD` / `SESSION_SECRET` 是否配齐。

**Q：不想用后端了？**
A：删掉 `functions/` 目录即可 —— 前端检测不到 `/api/login` 会自动退回本地模式，零改动。
