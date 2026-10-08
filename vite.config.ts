import { defineConfig, loadEnv } from 'vite';
import admin from './server/admin';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'ADMIN_');
  Object.assign(process.env, env);
  return { plugins: [{ name: 'tpplay-admin-local', configureServer(server) { server.middlewares.use('/api/admin', (req, res) => { void admin(req, res).catch(() => { if (!res.headersSent) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); } res.end(JSON.stringify({error:'No pudimos completar la solicitud.'})); }); }); } }] };
});
