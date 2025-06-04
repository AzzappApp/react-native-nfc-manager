import { serve } from 'inngest/next';
import env from '#env';
import { inngest } from '#inngest/client';
import {
  cancelEnrichContact,
  enrichContact,
} from '#inngest/functions/enrichContact';
import { sendPushNotification } from '#inngest/functions/notify';
import { notifyWebCardUsersBatch } from '#inngest/functions/notifyWebCardUsers';
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
    enrichContact,
    cancelEnrichContact,
    sendPushNotification,
  ],
});

export const maxDuration = 180; // for long-running enrichments

export const runtime = 'nodejs';
