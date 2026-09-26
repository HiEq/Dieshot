/* ============================================================
   POST /api/login  ——  管理口令校验（Cloudflare Pages Functions）
   ------------------------------------------------------------
   口令只在这里、服务端比对；浏览器拿到的是一个带签名的会话凭证（12 小时有效），
   看不到也猜不到任何秘密。配合 /api/gh 使用：GitHub Token 始终留在 Worker 的
   加密环境变量里，不进浏览器、不进仓库。

   需要的环境变量（Cloudflare 控制台 → Pages → Settings → Environment variables）：
     ADMIN_PASSWORD   管理口令（Secret）
     SESSION_SECRET   会话签名密钥（Secret，随机长字符串）
   ============================================================ */
const enc = new TextEncoder();

/* ---------- 服务端暴力破解限速 ----------
   前端的限速可以被控制台绕过，真正的防线在服务端：按 IP 计数，
   连续失败 5 次起指数退避（30 秒 → 10 分钟封顶），锁定期间直接 429。
   存在 Worker 实例内存里，实例重启即清 —— 对本站这个量级足够。 */
const attempts = new Map();
function clientIP(request){ return request.headers.get('CF-Connecting-IP') || 'unknown'; }
function lockState(ip){
  const a = attempts.get(ip) || {fails: 0, lockUntil: 0};
  if (Date.now() < a.lockUntil) return {locked: true, wait: Math.ceil((a.lockUntil - Date.now()) / 1000)};
  return {locked: false, rec: a};
}
function noteFail(ip, a){
  a.fails++;
  if (a.fails >= 5) a.lockUntil = Date.now() + Math.min(30000 * Math.pow(2, a.fails - 5), 600000);
  attempts.set(ip, a);
}

function b64url(bytes){
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function json(data, status){
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}
  });
}
/* 定长比较，避免用响应时间侧信道猜口令 */
function timingSafeEqual(a, b){
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  const len = Math.max(x.length, y.length);
  let diff = x.length ^ y.length;
  for (let i = 0; i < len; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}
export async function signSession(payload, secret){
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload))));
}

export async function onRequestPost({env, request}){
  const ip = clientIP(request);
  const lock = lockState(ip);
  if (lock.locked) return json({ok: false, error: 'too many attempts', retry: lock.wait}, 429);

  let body = {};
  try{ body = await request.json(); }catch(e){}
  const want = env.ADMIN_PASSWORD || '';
  if(!want) return json({ok: false, error: 'server not configured'}, 500);
  if(!timingSafeEqual(body.password || '', want)){
    noteFail(ip, lock.rec);
    return json({ok: false}, 401);
  }
  attempts.delete(ip);                                          /* 登录成功即清零 */

  const exp = Date.now() + 12 * 3600 * 1000;                     /* 12 小时 */
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const payload = exp + '.' + nonce;
  const sig = await signSession(payload, env.SESSION_SECRET || want);
  return json({ok: true, token: payload + '.' + sig, exp});
}

/* 其它方法一律 405 */
export function onRequest(){
  return json({ok: false, error: 'method not allowed'}, 405);
}
