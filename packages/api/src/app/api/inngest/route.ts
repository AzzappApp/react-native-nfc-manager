import { serve } from 'inngest/next';
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
  signingKey: process.env.INNGEST_SIGNING_KEY,
  functions: [
    sendEmailSignature,
    sendEmailSignatureBatch,
    notifyWebCardUsersBatch,
    notifyWebCardUser,
  ],
});

export const runtime = 'nodejs';
