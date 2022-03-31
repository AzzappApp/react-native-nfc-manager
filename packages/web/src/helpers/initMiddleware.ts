import type { NextApiRequest, NextApiResponse } from 'next';

// todo better typing
export default function initMiddleware(middleware: any) {
  return (req: NextApiRequest, res: NextApiResponse) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result: any) => {
        if (result instanceof Error) {
          reject(result);
          return;
        }
        resolve(result);
      });
    });
}
