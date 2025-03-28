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
  functions: [
    sendEmailSignature,
    sendEmailSignatureBatch,
    notifyWebCardUsersBatch,
    notifyWebCardUser,
  ],
});
