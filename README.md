# Layout · 极简图库

一个 Apple 官网风格的单文件静态图库：顶部可选版块导航（目前内置 **Layout** 版块）、图片陈列、
搜索 / 标签筛选、大图浏览、访客一键下载原图；管理员可通过图形界面上传、编辑、删除图片，
并借助 **GitHub 接口**把改动直接提交回仓库。

无任何外部依赖（不加载 CDN、字体、框架），可直接部署到 GitHub Pages。

---

## 文件结构

```
index.html        页面本体（HTML + CSS + JS 全部内嵌）
gallery.json      图片清单（标题 / 描述 / 标签 / 图片路径 / 管理口令哈希 / 接口设置）
CATALOG.md        按厂商分组的目录名单清单（自动生成，页脚有入口）
images/dieshot/   Die Shot 图库（网页版 4096px JPEG + 720px 缩略图，按厂商分子目录）
tools/            工具脚本：import-dieshot.js（导入压缩）/ build-catalog.js（生成清单）/ verify-ratio.js（长宽比校验）
.nojekyll         让 GitHub Pages 原样输出文件
```

## Die Shot 图库（批量导入）

图库内容来自本地 `D:\Dieshot_JPG\Dieshot\<厂商>\<图片>`：**子目录名 = 标签**（AMD、Intel、Apple Silicon …），
共 26 个厂商、219 张图。原图是超大分辨率（最大 500MP / 239MB，总计 9.4GB），无法直接上
GitHub（单文件 100MB 上限、Pages 站点 1GB 上限），因此导入时生成**网页版**挂载：

| 产物 | 规格 | 用途 |
| --- | --- | --- |
| `<图名>.jpg` | 长边 4096px，JPEG **q45**（Photoshop 式 4/12，mozjpeg 渐进式） | 浏览大图 / 访客下载 |
| `<图名>.thumb.jpg` | 长边 720px | 卡片预览（主界面只加载它） |

**长宽比严格不变**：只限制长边（`fit:inside` + 不放大小图），不裁切、不拉伸；
EXIF 旋转仅做方向转正。导入后用 `verify-ratio.js` 逐张比对网页版/缩略图与原图的比例（容差 0.5%）。

- 目录映射：`D:\Dieshot_JPG\Dieshot\<厂商>\X.png` → `images/dieshot/<厂商>/x-xxxx.jpg`；
- 标题 = 原文件名（去扩展名），描述 = `原图 宽 × 高`，标签 = 厂商子目录名；
- `gallery.json` 里的 `w/h` 记录**原图**尺寸，`size/name` 是网页版（即下载到的文件）；
- 原图保留在 D 盘不进仓库；若需原图下载，可另传 GitHub Releases 并把下载链接挂到条目上；
### 以后新增图片（三种方式）

**① 网页管理 GUI（日常少量，推荐）**

1. 打开网站 → 顶栏**锁图标** → 输入管理口令（口令仅站长持有，不写在任何公开文档里）→ 打开管理面板
2. 拖拽 / Ctrl+V 粘贴 / 点击选择图片 → 填标题、描述、**标签填厂商名**（自动成为筛选分类）→「保存到图库」
   （缩略图自动生成并一起提交，访客预览秒开）
3. 落盘方式二选一：
   - 已在「接口设置」填过 GitHub Token → **自动提交到仓库**，访客刷新即见
   - 未配置 → 存为本机草稿，点「导出 gallery.json」，再把图片与清单手动传上 GitHub
4. 界面里同样可以**编辑信息 / 删除**（已配置接口时会直接改仓库）

> 配置一次接口，以后全程点点即可：GitHub → Settings → Developer settings → Personal access tokens
> → 填 Token（fine-grained 需选中 Dieshot 仓库并给 `Contents: Read and write`；classic 勾选 `repo`）→
> 管理面板「接口设置」填 Token + `HiEq/Dieshot` + 分支 `main` + 图片目录 `images/dieshot` → 测试连接 → 保存。

**② 批量导入本地文件夹（几十张以上）**

1. 新图放进 `D:\Dieshot_JPG\Dieshot\<厂商>\`（子目录名 = 标签；新厂商 = 新建文件夹）
2. `node tools/import-dieshot.js` —— 生成 4096px q45 网页版 + 720px 缩略图并重建 `gallery.json`
   （当前为全量重建，约 22 分钟；只想增量导入可另行扩展脚本）
3. `node tools/build-catalog.js` 重建 `CATALOG.md`（可选 `node tools/verify-ratio.js` 校验长宽比）
4. 推送变更：`git add -A && git commit -m "add images" && git push`（已配本地代理）；
   或把新增的 `images/dieshot/<厂商>/*.jpg`（含 `.thumb.jpg`）+ 替换后的 `gallery.json`、`CATALOG.md` 手动传上 GitHub

**③ 纯 GitHub 网页手动上传（无脚本环境）**

1. 图片（≤ 25MB / 张）上传到 `images/dieshot/<厂商>/`
2. 最好同时放一张长边 720px 的 `同名.thumb.jpg`（没有也行：访客首次浏览会自动生成本地缓存，
   之后进管理模式点「补齐缩略图」即可批量补上）
3. 在 `gallery.json` 的 `items` 里加一条记录（照抄现有条目改字段即可）：

   ```jsonc
   {
     "id": "唯一ID", "title": "标题", "desc": "原图 宽 × 高", "tags": ["厂商"],
     "src": "images/dieshot/厂商/xx.jpg", "thumb": "images/dieshot/厂商/xx.thumb.jpg",
     "file": "images/dieshot/厂商/xx.jpg", "name": "xx.jpg", "size": 123456,
     "w": 12000, "h": 9000, "addedAt": "2026-09-23T00:00:00.000Z"
   }
   ```

## 两种模式

| 模式 | 谁在用 | 能做什么 |
| --- | --- | --- |
| **访客模式** | 所有打开网页的人 | 浏览、搜索、标签筛选、放大查看、下载原图 |
| **管理模式** | 站长（你） | 以上全部 + 上传 / 编辑 / 删除图片、修改管理口令、配置 GitHub 接口 |

### 进入管理模式

点击顶栏右侧的**锁形图标** → 输入管理口令。口令由站长私有保管，**不出现在任何公开文档或代码里**；
首次部署后请立即在管理面板里改成自己的口令（口令以 SHA-256 哈希存在 `gallery.json` 的 `config.adminHash` 中，
公开的只是哈希，无法反推口令）。

### 安全说明（谁能改内容？）

- **写入权限由 GitHub Token 把关**：改仓库必须持有你的 PAT，而 Token 只存在站长自己浏览器的 localStorage 中，
  **绝不写入 `gallery.json` 或任何随网页下发的文件**（代码在保存/导出清单时会强制剔除 Token 字段）；
- 访客即使进入管理模式（需要口令），其上传/编辑/删除也**只影响他自己浏览器的本地草稿**，看不到也改不了线上内容；
- 代码层面对上传、编辑、删除、改密等写操作都做了**管理模式二次校验**，绕过界面直接调用无效；
- 管理解锁状态只存在内存中，刷新即失效；不要用本口令保护机密内容——它只是防误操作的闸门。

## 图片管理的两种后端

### 1）仓库模式（推荐，正式上线用）

在管理面板 → 「接口设置（GitHub 仓库）」中填写：

| 字段 | 说明 |
| --- | --- |
| Personal Access Token | 具备目标仓库 **Contents: Read and write** 权限的 PAT（classic token 勾选 `repo` 即可） |
| 仓库所有者 / 仓库名 | 如 `my-name/my-site` |
| 分支 | 默认 `main` |
| 图片目录 | 默认 `images`（会自动按 `images/年-月/文件名` 归档） |
| 清单文件路径 | 默认 `gallery.json` |

填好后点「测试连接」确认可写，再「保存设置」。此后：

- **保存到图库** = 图片逐张提交到仓库图片目录 + 更新 `gallery.json`（一次 commit/张）
- **删除** = 删除仓库中的图片文件 + 更新 `gallery.json`
- 访客刷新页面即可看到最新内容（清单带时间戳请求，无缓存问题）

Token 只写在你浏览器的 `localStorage`，**不会**被提交进仓库，也不会出现在页面代码里。

### 2）本机模式（没配置接口时）

图片保存在浏览器 IndexedDB 中，带「仅本机」角标，**只有你这台设备能看到**。
所有改动会存为「本机草稿」，你随时可以：

- 点「导出 gallery.json」下载清单，连同图片手动提交到仓库；
- 配好 GitHub 接口后，改动会转为自动提交。

> 直接双击 `index.html` 用 `file://` 打开也能预览（此时读不到 `gallery.json`，会用内置示例兜底）。
> 想看真实数据，建议本地起个静态服务器：`python -m http.server 8000`，然后访问 `http://localhost:8000`。

## 性能与缩略图

**上传不卡**：大图（几十 MB 级）在加入队列时只解码一次，压成长边 720px 的 JPEG 缩略图（`createImageBitmap` 离主线程解码 + EXIF 自动转正）；多张排队逐个生成、每张让出一帧。缩略图会随原图一起提交到仓库（`xxx.thumb.jpg`）。

**主界面不卡**（浏览大量大图也流畅）：

- 网格里**永远只画小图**——大图的位图根本不进 DOM。清单里有 `thumb` 就直接用；没有就在图片**进入视口附近**时后台取原图、压成小图、存进 IndexedDB，之后每次打开都是秒开（实测二次访问原图 0 下载）；
- 卡片节点按 id 缓存复用：搜索/标签筛选只切换显隐，**不重建 DOM、图片不重复解码**（输入还带 120ms 防抖）；
- 建卡分批进行（每帧约 30 张），几百张图首帧也不掉帧；
- 屏外卡片走 `content-visibility` 跳过布局与绘制；排序改用共享 `Intl.Collator`；
- 后台压图队列在灯箱打开、页面切后台时自动让位，回到前台继续（不影响原图加载）；
- 灯箱是渐进加载：先秒开缩略图，原图后台解码完成后无缝替换，并在空闲时预取前后两张。

**交互即时响应**（点击、开灯箱不卡手）：

- 点击卡片**瞬间**小图就上屏（不等数据库、不等网络），原图在后台解码好再无缝替换（`img.decode()` 预解码，替换不掉帧）；没有小图的旧图直接渐进式显示原图；
- 打开灯箱不再触发整页重排（`scrollbar-gutter: stable` 预留滚动条位置）；
- 卡片按压立刻有缩放反馈；hover 只过渡 `transform`（合成层完成），`box-shadow` 不参与动画；
- 触屏 `touch-action: manipulation` 免去双击缩放判定延迟；建卡分批让出主线程（支持 `scheduler.yield`）；
- 灯箱直接使用当前筛选后的可见列表，点击时不再重新计算。

> 早期上传的图片没有缩略图？进「管理模式 → 补齐缩略图」，会自动为全部旧图生成并提交缩略图（已浏览过的图直接复用本地缓存，不重复下载）。

## gallery.json 格式

```jsonc
{
  "version": 1,
  "site":  { "title": "Layout", "sub": "首页副标题" },
  "config": {
    "adminHash": "管理口令的 SHA-256（小写十六进制）",
    "github": { "token": "", "owner": "", "branch": "main", "dir": "images", "manifest": "gallery.json" }
  },
  "items": [
    {
      "id": "唯一 ID",
      "title": "标题",
      "desc": "描述（可空）",
      "tags": ["标签1", "标签2"],
      "src":  "images/2026-03/xxx.jpg",   // 页面里显示的图片地址（相对路径最佳）
      "thumb":"images/2026-03/xxx.thumb.jpg", // 预览用缩略图（没有则回退到 src）
      "file": "images/2026-03/xxx.jpg",   // 仓库内路径，删除时用
      "name": "xxx.jpg",                  // 下载时的文件名
      "size": 123456,
      "w": 6000, "h": 4000,               // 原图尺寸（可选，用于信息栏显示）
      "addedAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

手改 `gallery.json` 后推送到仓库即可生效，不必非走界面。

## 部署到 GitHub Pages

1. 新建仓库（公开），把本目录所有文件推上去：
   ```bash
   git init
   git add .
   git commit -m "Layout gallery"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 仓库 **Settings → Pages → Build and deployment**：Source 选 `Deploy from a branch`，Branch 选 `main / (root)`，保存。
3. 一两分钟后访问 `https://<你的用户名>.github.io/<仓库名>/`。

> 想用自定义域名：把域名写进 Pages 设置并放一个 `CNAME` 文件即可；站点所有资源都是相对路径，子目录部署也没问题。

## 以后想加新版块

顶栏导航是数据驱动的，改 `index.html` 里的 `NAV` 数组 + 新增一个 `<section class="view">` 即可，
参考 `Layout` 版块的写法（约在 `/* ---------- 顶栏与路由 ---------- */` 一节）。

## 快捷键（访客 / 管理通用）

| 按键 | 作用 |
| --- | --- |
| `Esc` | 关闭大图 / 弹窗 |
| `←` `→` | 上一张 / 下一张 |
| `Ctrl` / `⌘` + `V` | 在管理面板里粘贴截图上传 |
