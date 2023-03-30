import { verifyToken } from '@azzapp/auth/tokens';
import { getUsersByIds } from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';

import { executeCommand } from '#dataProviders';
import type { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  const { method } = req;
  if (method !== 'POST') {
    return res.status(405).end(`Method ${method} Not Allowed`);
  }
  const token = req.headers['authorization']?.split(' ')?.[1] ?? null;
  if (!token) {
    res.status(401).json({ message: ERRORS.UNAUTORIZED });
    return;
  }
  let userId: string;
  try {
    ({ userId } = await verifyToken(token));
  } catch (e) {
    res.status(401).json({ message: ERRORS.INVALID_TOKEN });
    return;
  }
  const [user] = await getUsersByIds([userId]);
  if (!user) {
    res.status(401).json({ message: ERRORS.UNAUTORIZED });
    return;
  }

  try {
    const { command, resource, params } = req.body;
    const result = await executeCommand({ command, resource, params }, user);
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === ERRORS.INVALID_REQUEST) {
        res.status(501).json({ message: ERRORS.INVALID_REQUEST });
        return;
      }
      if (e.message === ERRORS.UNAUTORIZED) {
        res.status(403).json({ message: ERRORS.UNAUTORIZED });
        return;
      }
    }
    console.error(e);
    res.status(500).json({ message: ERRORS.INTERNAL_SERVER_ERROR });
  }
};

export default handler;
