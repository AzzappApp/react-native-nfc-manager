import type { IncomingMessage, ServerResponse } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';

const applyConnectMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  middleware: (
    req: IncomingMessage,
    res: ServerResponse,
    next: (result?: any) => void,
  ) => void,
) =>
  new Promise((resolve, reject) => {
    middleware(req, res, (result: any) => {
      if (result instanceof Error) {
        reject(result);
        return;
      }
      resolve(result);
    });
  });

export default applyConnectMiddleware;
