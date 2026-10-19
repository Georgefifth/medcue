import { defineConfig, loadEnv } from 'vite';
import { createAiHandler } from './server/ai.mjs';
export default defineConfig(({ mode }) => {
  const values = loadEnv(mode, process.cwd(), '');
  for (const [name, value] of Object.entries(values)) if (!name.startsWith('VITE_') && process.env[name] === undefined) process.env[name] = value;
  const aiHandler = createAiHandler();
  return { base: './', build: { outDir: mode === 'pages' ? 'dist-pages' : 'dist' }, server: { host: '127.0.0.1', port: 5173, strictPort: true }, plugins: [{ name: 'model-review', configureServer(server) { server.middlewares.use(aiHandler); }, configurePreviewServer(server) { server.middlewares.use(aiHandler); } }] };
});
