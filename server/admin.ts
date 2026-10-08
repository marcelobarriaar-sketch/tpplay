import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { areas, missions, resources } from '../src/data';
const cookieName = 'tpplay_admin';
const attempts = new Map<string, { count: number; until: number }>();
export function verifyPassword(password: string, encoded: string) {
  const [salt, hash] = encoded.split(':');
  if (!salt || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}
function sign(value: string, secret: string) { return createHmac('sha256', secret).update(value).digest('base64url'); }
export function createSession(user: string, secret: string, now = Date.now()) {
  const value = Buffer.from(JSON.stringify({ user, exp: now + 3600000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return `${value}.${sign(value, secret)}`;
}
export function readSession(token: string, secret: string, user: string, now = Date.now()) {
  try {
    const [value, signature] = token.split('.'); const expected = sign(value, secret);
    if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString());
    return payload.user === user && Number.isFinite(payload.exp) && payload.exp > now;
  } catch { return false; }
}
export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json'); res.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (status: number, value: object) => { res.statusCode = status; res.end(JSON.stringify(value)); };
  const secret = process.env.ADMIN_SESSION_SECRET || ''; const user = process.env.ADMIN_USER || 'admin'; const hash = process.env.ADMIN_PASSWORD_HASH || '';
  if (secret.length < 32 || !hash) return send(503, { error: 'El acceso de administrador no está configurado en este servidor.' });
  const secure = !!process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
  const setCookie = (value: string, age: number) => res.setHeader('Set-Cookie', `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? '; Secure' : ''}`);
  const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
  if (req.method === 'GET') {
    if (!readSession(token, secret, user)) return send(401, { error: 'Ingresa como administrador para continuar.' });
    return send(200, { user, areas: areas.map(a=>({name:a.name, modules:a.modules.length})), missions: missions.map(m=>({title:m.title,slug:m.slug})), resourceCount: resources.length });
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(405, { error: 'Método no permitido.' }); }
  const origin = req.headers.origin;
  if (!origin || (()=>{try{return new URL(origin).host !== req.headers.host;}catch{return true;}})()) return send(403, { error: 'Solicitud no permitida.' });
  if (!(req.headers['content-type'] || '').startsWith('application/json')) return send(415, { error: 'Formato no permitido.' });
  let body: { action?: string; username?: string; password?: string };
  try {
    if (req.body) body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    else { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 4096) return send(413, { error: 'Solicitud demasiado larga.' }); } body = JSON.parse(raw); }
  } catch { return send(400, { error: 'Solicitud inválida.' }); }
  if (body.action === 'logout') { setCookie('', 0); return send(200, { ok: true }); }
  if (body.action !== 'login') return send(400, { error: 'Acción inválida.' });
  const ip = req.socket.remoteAddress || 'unknown'; const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const limit = attempts.get(ip);
  if (limit && limit.count >= 5) { res.setHeader('Retry-After', String(Math.ceil((limit.until - now)/1000))); return send(429, { error: 'Demasiados intentos. Espera 15 minutos antes de volver a ingresar.' }); }
  if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.password.length > 256) return send(400, { error: 'Revisa usuario y contraseña.' });
  const validPassword = verifyPassword(body.password, hash);
  if (body.username !== user || !validPassword) { attempts.set(ip, { count: (limit?.count || 0) + 1, until: limit?.until || now + 900000 }); return send(401, { error: 'Usuario o contraseña incorrectos.' }); }
  attempts.delete(ip); setCookie(createSession(user, secret), 3600); return send(200, { ok: true });
}
