/* 依据 gallery.json 生成按厂商分组的目录清单 CATALOG.md */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COLL = new Intl.Collator('zh-Hans-CN');
const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
const kb = (b) => Math.max(1, Math.round(b / 1024)) + ' KB';
const size = (b) => (b >= 1048576 ? mb(b) : kb(b));
const num = (n) => (n || 0).toLocaleString('en-US');

(async () => {
  const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'gallery.json'), 'utf8'));
  const groups = new Map();
  let total = 0;
  for (const it of g.items) {
    const tag = (it.tags && it.tags[0]) || '未分类';
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag).push(it);
    total += it.size || 0;
  }
  const tags = [...groups.keys()].sort(COLL.compare);
  const thumbs = g.items.reduce((a, i) => a + (i.thumb ? 1 : 0), 0);

  const L = [];
  L.push('# Die Shot 图库 · 厂商目录清单');
  L.push('');
  L.push(`> 本文件由 \`tools/build-catalog.js\` 依据 \`gallery.json\` 自动生成（${new Date().toISOString().slice(0, 10)}），请勿手工编辑。`);
  L.push(`> **${tags.length} 家厂商 · ${g.items.length} 张** · 网页版合计 ${mb(total)}（JPEG q45 / 长边 4096px）· ${thumbs} 张缩略图（720px）。`);
  L.push('> 图片长宽比与原图完全一致；原图（约 9.4 GB）保留在本地，未入库。');
  L.push('');
  L.push('## 总览');
  L.push('');
  L.push('| 厂商（标签） | 数量 | 网页版体积 | 目录 |');
  L.push('| --- | ---: | ---: | --- |');
  for (const tag of tags) {
    const items = groups.get(tag);
    const s = items.reduce((a, i) => a + (i.size || 0), 0);
    const dir = path.dirname(items[0].src).replace(/\\/g, '/');
    L.push(`| [${tag}](#${encodeURIComponent(tag).replace(/%/g, '')}-t) | ${items.length} | ${size(s)} | \`${dir}/\` |`);
  }
  L.push(`| **合计** | **${g.items.length}** | **${mb(total)}** | \`images/dieshot/\` |`);

  for (const tag of tags) {
    const items = groups.get(tag).sort((a, b) => COLL.compare(a.title, b.title));
    const s = items.reduce((a, i) => a + (i.size || 0), 0);
    L.push('');
    L.push(`## ${tag} <a id="${encodeURIComponent(tag).replace(/%/g, '')}-t"></a>`);
    L.push('');
    L.push(`共 ${items.length} 张 · 网页版 ${size(s)}`);
    L.push('');
    L.push('| # | 标题 | 原图分辨率 | 网页版 |');
    L.push('| ---: | --- | --- | ---: |');
    items.forEach((it, i) => {
      const dim = it.w && it.h ? `${num(it.w)} × ${num(it.h)}` : '—';
      L.push(`| ${i + 1} | [${it.title.replace(/\|/g, '\\|')}](${encodeURI(it.src)}) | ${dim} | ${size(it.size)} |`);
    });
  }

  L.push('');
  L.push('---');
  L.push('');
  L.push(`生成方式：\`node tools/build-catalog.js\`（网页部署后这些链接可直接点开对应图片）。`);
  fs.writeFileSync(path.join(ROOT, 'CATALOG.md'), L.join('\n') + '\n', 'utf8');
  console.log(`已生成 CATALOG.md：${tags.length} 个厂商分组，${g.items.length} 条目，合计 ${mb(total)}`);
})().catch((e) => { console.error('生成失败:', e.message); process.exit(1); });
