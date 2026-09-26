<div align="center">
  <img src="1.jpg" width="96" height="96" alt="HiEQ" style="border-radius:24px">
  <h1>HiEQ · HOME</h1>
  <p><b>个人主页</b> ＋ <b>Dieshot图库</b></p>
  <p>
    <a href="https://hieq-home404.pages.dev/"><b>🌐 在线访问</b></a>
    &nbsp;·&nbsp;
    <a href="CATALOG.md"><b>📚 厂商目录清单</b></a>
    &nbsp;·&nbsp;
    <a href="https://github.com/HiEq"><b>🧑‍💻 我的 GitHub</b></a>
    &nbsp;·&nbsp;
    <a href="https://space.bilibili.com/571650607"><b>📺 我的 Bilibili</b></a>
  </p>
  <p>
    <img alt="Cloudflare Pages" src="https://img.shields.io/badge/Cloudflare%20Pages-Live-brightgreen">
    <img alt="Die Shot" src="https://img.shields.io/badge/Die%20Shot-221%20张-blue">
    <img alt="Vendors" src="https://img.shields.io/badge/厂商-27%20家-orange">
    <img alt="Single file" src="https://img.shields.io/badge/单文件-零依赖-lightgrey">
    <img alt="Live2D" src="https://img.shields.io/badge/Live2D-Cubism%204-pink">
  </p>
</div>

---

## 📖 关于这个站点

| 版块 | 内容 |
| --- | --- |
| 🏠 **首页** | 整屏实景背景 + 「HIEQ的小站」标题与跳转按钮 + Live2D 桌宠 |
| 🔬 **Layout** | **DieShot**：221 张Dieshot，27 家厂商，支持搜索与标签筛选 |
| 🖼️ **杂图** | 零散图片墙（滚动墙 / 全部列表两种浏览方式） |

---

## ✨ 功能特性

### 🐱 Live2D 桌宠
- **多模型**：可在编辑模式里一键切换
- **表情系统**：每个模型各自的表情集，数量不同也能自动适配
- **鼠标拖拽**：编辑模式下直接拖动调整位置，电脑端 / 移动端互不影响
- **大小可调**：50%–180% 滑杆缩放，画布与模型同步重算，放大不糊
- **随机表情**：点按桌宠或每 8 秒随机换取表情
- **贴边折叠**：任何位置、任何尺寸下都能一键藏到屏幕边缘，只留侧边箭头
- **只存本机**：位置 / 大小 / 表情 / 随机开关全部存在浏览器本地，改桌宠不会触发仓库提交与重建

### 🖼️ Die Shot 图库
- **221 张**Dieshot，网页版统一 **4096px 长边 / JPEG q45**
- **27 家厂商**标签：Intel、AMD、Apple Silicon、NVIDIA、Qualcomm、Hisilicon、Samsung、MediaTek…
- 全文搜索（标题 / 描述 / 标签）＋ 标签侧栏筛选 ＋ 多种排序
- 灯箱浏览（← → 切换、Esc 关闭）、一键下载原图
- **缩略图管线**：720px 缩略图按需懒加载，几百张图首帧也不卡

### 🎛️ 管理模式
- 管理口令解锁后可**上传 / 编辑 / 删除**图片，访客只读
- 支持拖拽、粘贴截图批量上传，后台逐张生成缩略图
- 改动通过 **Contents API 直接提交仓库**，访客刷新即见（Cloudflare 部署下 Token 存在服务端，浏览器不接触）
- 也可离线保存到本机草稿，随时「同步到 GitHub」补交
- 换主页背景、改口令、补齐缩略图、导出 gallery.json

### 🌗 其它
- 夜间 / 日间双主题（跟随系统，可手动切换）
- 中文 / English 双语即时切换
- 移动端自适应：底部 Dock、刘海安全区、点按高亮优化
- 访问统计：总访问量 / 当前在线人数

---

## 📊 图库一览

| 厂商 | 数量 | 厂商 | 数量 |
| --- | --: | --- | --: |
| Intel | 45 | MediaTek | 6 |
| AMD | 33 | Microsoft | 5 |
| Apple Silicon | 31 | Sony | 5 |
| NVIDIA | 24 | Google | 4 |
| Qualcomm | 21 | Xiaomi | 3 |
| Hisilicon | 15 | IBM | 2 |
| Samsung | 12 | Baikal / MCST-Elbrus | 各 2 |

> 完整清单（含目录路径、体积、跳转锚点）见 **[CATALOG.md](CATALOG.md)**

---

## 🧩 技术栈

| 层 | 选型 |
| --- | --- |
| 页面 | 原生 HTML / CSS / JS |
| Live2D | Cubism 4 Core ＋ PixiJS ＋ pixi-live2d-display |
| 字体 | Qualcomm Next（打包在 `fonts/`，Regular / Medium） |
| 部署 | Cloudflare Pages + Pages Functions（后端鉴权，`hieq-home404.pages.dev`） |
| 内容 | GitHub Contents API（管理后台直接写 `gallery.json` 与图片） |

---

## 📁 目录结构

```
index.html              页面本体（HTML + CSS + JS 全部内嵌）
gallery.json            图片清单（标题 / 描述 / 标签 / 图片路径 / 管理口令哈希 / 接口设置）
misc.json               杂图清单（与 Dieshot 完全分开）
CATALOG.md              按厂商分组的目录清单（自动生成，页脚有入口）
1.jpg                   站点图标（favicon / apple-touch-icon）
fonts/                  Qualcomm Next 字体（Regular / Medium）
live2d/                 Live2D 运行库与模型（lib/ ＋ model/）
images/dieshot/         Die Shot 图库（4096px JPEG ＋ 720px 缩略图，按厂商分子目录）
images/misc/            杂图
tools/                  工具脚本：import-dieshot.js / build-catalog.js / verify-ratio.js
.nojekyll               让 GitHub Pages 原样输出文件（兼容保留）
```

---

## 🗂️ gallery.json 格式

```jsonc
{
  "version": 1,
  "site": {
    "title": "Layout",
    "brand": "HiEq",
    "avatar": "https://github.com/HiEq.png?size=64",
    "bg": "images/home-bg.jpg"
  },
  "config": {
    "adminHash": "SHA-256",
    "github": { "token": "", "owner": "your-name/your-repo", "branch": "main", "dir": "images/dieshot", "manifest": "gallery.json" }
  },
  "items": [
    {
      "id": "唯一 ID",
      "title": "标题",
      "desc": "描述（可空）",
      "tags": ["标签1", "标签2"],
      "src":  "images/2026-03/xxx.jpg",        // 页面里显示的图片地址（相对路径最佳）
      "thumb": "images/2026-03/xxx.thumb.jpg", // 预览用缩略图（没有则回退到 src）
      "file": "images/2026-03/xxx.jpg",        // 仓库内路径，删除时用
      "name": "xxx.jpg",                       // 下载时的文件名
      "size": 123456,
      "w": 6000, "h": 4000,
      "addedAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

---

## 🛠️ 工具脚本

| 脚本 | 作用 |
| --- | --- |
| `tools/import-dieshot.js` | 导入压缩：原图 → 4096px JPEG q45 ＋ 720px 缩略图，按标签分目录 |
| `tools/build-catalog.js` | 依据 `gallery.json` 生成 `CATALOG.md` 厂商目录 |
| `tools/verify-ratio.js` | 校验缩略图与原图长宽比一致 |

---

## 🙏 图片来源

Die Shot 图片主要来源于 B 站 UP 主：

- [@万扯淡](https://space.bilibili.com/374034429)
- [@硬件趣玩](https://space.bilibili.com/1862917461)

以及其它等作者的公开分享，仅作学习与收藏整理，版权归原作者及厂商所有。

---

<div align="center">
  <sub>Layout 与全部代码由 <a href="https://github.com/HiEq">HiEq</a> 完成 · 如有错误欢迎提 Issue</sub>
</div>
