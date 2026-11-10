import serverless from 'serverless-http';
import { createApp } from '../../server/app.js';

let handlerInstance: any = null;

export const handler = async (event: any, context: any) => {
  // Prevent serverless function from hanging waiting for open pooled DB sockets
  context.callbackWaitsForEmptyEventLoop = false;

  if (!handlerInstance) {
    const app = await createApp();
    handlerInstance = serverless(app);
  }

  // Normalize path if Netlify forwards via /.netlify/functions/api
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    const normalized = event.path.replace('/.netlify/functions/api', '/api');
    event.path = normalized.startsWith('/api') ? normalized : `/api${normalized}`;
  }

  return handlerInstance(event, context);
};
