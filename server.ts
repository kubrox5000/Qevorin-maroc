import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createApp } from './server/app.js';
import { isNeonConfigured } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export { createApp };

export async function startServer() {
  const app = await createApp();
  const PORT = process.env.PORT || 3000;

  // ==========================================================================
  // VITE DEV MIDDLEWARES OR PRODUCTION SERVE
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`QEVORIN Moroccan e-commerce server running on http://0.0.0.0:${PORT}`);
    if (isNeonConfigured()) {
      console.log('Neon PostgreSQL database is configured.');
    } else {
      console.log('Neon PostgreSQL: DATABASE_URL not set. Running with fallback repository.');
    }
  });
}

// Automatically start server when run in standalone mode (not serverless handler)
if (process.env.NETLIFY !== 'true' && !process.env.LAMBDA_TASK_ROOT) {
  startServer();
}
