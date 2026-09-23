# Layout图库

一个 单文件静态图库：顶部可选版块导航（目前内置 **Layout** 版块）、图片陈列、
搜索 / 标签筛选、大图浏览、访客一键下载原图；管理员可通过图形界面上传、编辑、删除图片，
并借助 **GitHub 接口**把改动直接提交回仓库。
网页发布在https://hieq.github.io/Dieshot/#/上
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
## 图片主要来源于B站UP
@万扯淡 https://space.bilibili.com/374034429?spm_id_from=333.788.upinfo.detail.click
@硬件趣玩 https://space.bilibili.com/1862917461?spm_id_from=333.337.0.0等
## Layout由本人完成，如有错误尽请谅解

