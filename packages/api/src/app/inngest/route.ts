import { serve } from 'inngest/next';
import env from '#env';
import { inngest } from '#inngest/client';
import {
  notifyWebCardUsersBatch,
  notifyWebCardUser,
} from '#inngest/functions/notifyWebCardUsers';
import {
  sendEmailSignature,
  sendEmailSignatureBatch,
} from '#inngest/functions/sendEmailSignature';

export const { GET, POST, PUT } = serve({
  client: inngest,
  signingKey: env.INNGEST_SIGNING_KEY,
  functions: [
    sendEmailSignature,
    sendEmailSignatureBatch,
    notifyWebCardUsersBatch,
    notifyWebCardUser,
  ],
});

export const runtime = 'nodejs';
