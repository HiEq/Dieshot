/* ============================================================
   POST /api/gh  ——  GitHub Contents API 代理（Cloudflare Pages Functions）
   ------------------------------------------------------------
   浏览器只带会话凭证（X-Admin-Token），真正的 GitHub Token 存在 Worker 的
   加密环境变量里，绝不下发给前端。会话有效才放行；仓库固定在服务端配置，
   客户端无法把 Token 指向别的仓库。

   需要的环境变量：
     GITHUB_TOKEN   具有 Contents: Read and write 权限的 Personal Access Token（Secret）
     GH_REPO        例如 HiEq/HOME
     SESSION_SECRET 与 /api/login 一致
     ADMIN_PASSWORD 与 /api/login 一致（会话签名的兜底密钥）
   ============================================================ */
const enc = new TextEncoder();

function b64urlDecode(s){
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function json(data, status){
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}
  });
}
async function signSession(payload, secret){
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
  let s = '';
  for (const b of sig) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sigEqual(a, b){
  const x = b64urlDecode(a), y = b64urlDecode(b);
  if (x.length !== y.length || x.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
async function verifySession(token, env){
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return false;
  const exp = Number(parts[0]) || 0;
  if (!exp || exp < Date.now()) return false;                     /* 过期 */
  const payload = parts[0] + '.' + parts[1];
  const sig = await signSession(payload, env.SESSION_SECRET || env.ADMIN_PASSWORD || '');
  return sigEqual(sig, parts[2]);
}

export async function onRequestPost({env, request}){
  const token = request.headers.get('X-Admin-Token') || '';
  if (!(await verifySession(token, env))) return json({ok: false, error: 'unauthorized'}, 401);

  let body = {};
  try{ body = await request.json(); }catch(e){}
  const method = String(body.method || 'GET').toUpperCase();
  /* 空路径 = 仓库根目录（「测试连接」查的就是根目录），两侧多余斜杠先去掉 */
  const path = String(body.path || '').replace(/^\/+/, '').replace(/\/+$/, '');
  const repo = env.GH_REPO || '';
  /* 路径白名单校验：只允许普通字符、禁止 .. 路径穿越 */
  if (!repo || (path && (!/^[A-Za-z0-9._\-\/]+$/.test(path) || path.indexOf('..') >= 0))) {
    return json({ok: false, error: 'bad request'}, 400);
  }
  if (!['GET', 'PUT', 'DELETE'].includes(method)) return json({ok: false, error: 'bad method'}, 400);

  const url = 'https://api.github.com/repos/' + repo + '/contents/' + path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': 'token ' + (env.GITHUB_TOKEN || ''),
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'hieq-home-pages'
      },
      body: body.body ? String(body.body) : undefined
    });
    const data = await res.json().catch(() => null);
    return json(data, res.status);
  } catch (e) {
    return json({ok: false, error: 'upstream error'}, 502);
  }
}

export function onRequest(){
  return json({ok: false, error: 'method not allowed'}, 405);
}
