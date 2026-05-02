import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of Object.keys(env)) {
    if (env[key] && !(key in process.env)) process.env[key] = env[key];
  }

  return {
    // Relative asset URLs so the Capacitor webview can load them from the
    // file:// (or capacitor://) scheme. Harmless for the web build too.
    base: './',
    plugins: [
      react(),
      {
        name: 'api-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith('/api/chat')) return next();
            try {
              const mod = await server.ssrLoadModule('/api/chat.js');
              await mod.default(req, res);
            } catch (e) {
              console.error('[api/chat dev]', e);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
        },
      },
    ],
  };
});
