import { serve } from 'inngest/next';
import env from '#env';
import { inngest } from '#inngest/client';
import {
  cancelEnrichContact,
  enrichContact,
} from '#inngest/functions/enrichContact';
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
    enrichContact,
    cancelEnrichContact,
  ],
});

export const runtime = 'nodejs';
