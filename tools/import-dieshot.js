/* Dieshot 导入器：D:\Dieshot_JPG\Dieshot\<厂商>\<图> → images/dieshot/<厂商>/（4096px JPEG + 720px 缩略图）+ gallery.json */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = 'D:\\Dieshot_JPG\\Dieshot';
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'dieshot');
const MANIFEST = path.join(ROOT, 'gallery.json');
const WEB_EDGE = 4096;
const THUMB_EDGE = 720;
const QUALITY = 45;              // Photoshop 式 4/12 ≈ libjpeg q45（用户选定）

sharp.cache({ memory: 256, files: 0, items: 128 });
sharp.concurrency(2);            // 巨图解码内存大，限制内部并发

const slug = (s) => String(s)
  .normalize('NFKD')
  .replace(/[^\w.-]+/g, '-')
  .replace(/-{2,}/g, '-')
  .replace(/^[-.]+|[-.]+$/g, '')
  .toLowerCase() || 'image';
const hash4 = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(4, '0').slice(0, 4);
};
const mb = (b) => (b / 1048576).toFixed(1) + 'MB';
const log = (s) => { process.stdout.write(s + '\n'); fs.appendFileSync(path.join(__dirname, 'import-dieshot.log.txt'), s + '\n'); };

(async () => {
  const t0 = Date.now();
  const tagDirs = fs.readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

  // 沿用现有 site / config（口令哈希、接口设置不变）
  let manifest = { version: 1, site: { title: 'Layout', sub: '把每一张图，放在恰好的位置。浏览、搜索、下载，一切刚刚好。' }, config: {} };
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (e) {}
  manifest.version = 1;
  manifest.items = [];

  const EXT = /^\.(jpe?g|png|webp|gif|bmp|tiff?)$/i;
  let seq = 0, done = 0, skipped = 0, inBytes = 0, outBytes = 0, thumbBytes = 0;
  const all = [];
  for (const d of tagDirs) {
    for (const f of fs.readdirSync(path.join(SRC, d.name), { withFileTypes: true })) {
      if (f.isFile() && EXT.test(path.extname(f.name))) all.push({ tag: d.name, name: f.name });
    }
  }
  log(`共 ${tagDirs.length} 个标签目录，${all.length} 张图片，目标长边 ${WEB_EDGE}px JPEG q${QUALITY}`);

  for (const d of tagDirs) {
    const tag = d.name;
    const outDir = path.join(OUT, slug(tag));
    fs.mkdirSync(outDir, { recursive: true });
    const files = fs.readdirSync(path.join(SRC, tag), { withFileTypes: true })
      .filter((f) => f.isFile() && EXT.test(path.extname(f.name)))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

    for (const f of files) {
      seq++;
      const srcPath = path.join(SRC, tag, f.name);
      const base = path.basename(f.name, path.extname(f.name));   // 标题 = 原文件名（去扩展名）
      const stem = `${slug(base).slice(0, 48) || 'image'}-${hash4(tag + '/' + f.name)}`;
      const webName = `${stem}.jpg`;
      const thumbName = `${stem}.thumb.jpg`;
      const webPath = path.join(outDir, webName);
      const thumbPath = path.join(outDir, thumbName);
      const st = fs.statSync(srcPath);
      inBytes += st.size;

      try {
        const meta = await sharp(srcPath, { limitInputPixels: false, sequentialRead: true, failOn: 'none' }).metadata();
        const t = Date.now();
        await sharp(srcPath, { limitInputPixels: false, sequentialRead: true, failOn: 'none' })
          .rotate()                                   // 按 EXIF 转正（比例不变）
          .resize({ width: WEB_EDGE, height: WEB_EDGE, fit: 'inside', withoutEnlargement: true })  // 只限长边，长宽比严格保持
          .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true, chromaSubsampling: '4:2:0' })
          .toFile(webPath);
        const tWeb = Date.now() - t;
        // 缩略图从网页版再压（快得多）
        await sharp(webPath)
          .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true })
          .toFile(thumbPath);
        const webSize = fs.statSync(webPath).size;
        const thumbSize = fs.statSync(thumbPath).size;
        outBytes += webSize; thumbBytes += thumbSize;

        manifest.items.push({
          id: `ds-${hash4(tag + '/' + f.name)}-${seq}`,
          title: base,
          desc: `原图 ${meta.width} × ${meta.height}`,
          tags: [tag],
          src: `images/dieshot/${slug(tag)}/${webName}`,
          thumb: `images/dieshot/${slug(tag)}/${thumbName}`,
          file: `images/dieshot/${slug(tag)}/${webName}`,
          name: `${base}.jpg`,
          size: webSize,
          w: meta.width || 0,
          h: meta.height || 0,
          addedAt: st.mtime.toISOString()
        });
        done++;
        log(`[${done}/${all.length}] ${tag}/${f.name}  原图 ${meta.width}x${meta.height} ${mb(st.size)} → 网页版 ${mb(webSize)} + 缩略图 ${mb(thumbSize)}  (${tWeb}ms)`);
      } catch (e) {
        skipped++;
        log(`[失败] ${tag}/${f.name}  ${e.message}`);
      }
      // 每 20 张落一次盘，中断也不至于全丢
      if (seq % 20 === 0) fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    }
  }

  // 清单排序：按标签、再按标题，方便人工查看
  manifest.items.sort((a, b) => (a.tags[0] || '').localeCompare(b.tags[0] || '', 'zh-Hans-CN') || a.title.localeCompare(b.title, 'zh-Hans-CN'));
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  log('----');
  log(`完成：${done} 张，失败 ${skipped} 张，耗时 ${mins} 分钟`);
  log(`原图总计 ${mb(inBytes)} → 网页版 ${mb(outBytes)} + 缩略图 ${mb(thumbBytes)}`);
  log(`标签数：${new Set(manifest.items.map((i) => i.tags[0])).size}`);
  fs.rmSync(path.join(ROOT, 'images', 'demo-01.svg'), { force: true });
  fs.rmSync(path.join(ROOT, 'images', 'demo-02.svg'), { force: true });
  fs.rmSync(path.join(ROOT, 'images', 'demo-03.svg'), { force: true });
  fs.rmSync(path.join(ROOT, 'images', 'demo-04.svg'), { force: true });
  log('已移除 4 张示例图（demo-01~04.svg）');
})();
