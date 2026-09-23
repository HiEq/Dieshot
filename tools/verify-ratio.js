/* 校验：网页版/缩略图的长宽比必须与原图一致（用户要求：不得改变长宽比） */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

(async () => {
  const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'gallery.json'), 'utf8'));
  let checked = 0, bad = [];
  for (const it of g.items) {
    const webPath = path.join(ROOT, ...it.src.split('/'));
    const thumbPath = it.thumb ? path.join(ROOT, ...it.thumb.split('/')) : null;
    if (!fs.existsSync(webPath)) { bad.push([it.title, '网页版缺失']); continue; }
    const meta = await sharp(webPath).metadata();
    const r0 = it.w / it.h;
    const r1 = meta.width / meta.height;
    const err = Math.abs(r1 - r0) / r0;
    let note = '';
    if (err > 0.005) { bad.push([it.title, `网页版比例偏差 ${(err * 100).toFixed(2)}%（原图 ${it.w}x${it.h} → ${meta.width}x${meta.height}）`]); continue; }
    // 原图/网页版的 EXIF 旋转可能造成宽高互换，比例取倒数也算一致
    const errInv = Math.abs(1 / r1 - r0) / r0;
    if (err > 0.005 && errInv > 0.005) continue;
    if (thumbPath && fs.existsSync(thumbPath)) {
      const tm = await sharp(thumbPath).metadata();
      const rt = tm.width / tm.height;
      const e2 = Math.min(Math.abs(rt - r1), Math.abs(1 / rt - r1)) / r1;
      if (e2 > 0.01) { bad.push([it.title, `缩略图比例偏差 ${(e2 * 100).toFixed(2)}%`]); continue; }
    }
    checked++;
    if (checked % 50 === 0) console.log(`已校验 ${checked} …`);
  }
  console.log('----');
  console.log(`校验通过 ${checked} / ${g.items.length} 张（网页版 + 缩略图 长宽比与原图一致，容差 0.5%）`);
  if (bad.length) {
    console.log('异常 ' + bad.length + ' 项：');
    bad.slice(0, 10).forEach((b) => console.log('  ' + b[0] + ': ' + b[1]));
    process.exit(1);
  }
  console.log('全部长宽比一致 ✅');
})().catch((e) => { console.error('校验失败:', e.message); process.exit(1); });
