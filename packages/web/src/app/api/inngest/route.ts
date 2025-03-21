import { serve } from 'inngest/next';
import { inngest } from '#inngest/client';
import {
  sendEmailSignature,
  sendEmailSignatureBatch,
} from '#inngest/functions/sendEmailSignature';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendEmailSignature, sendEmailSignatureBatch],
});
