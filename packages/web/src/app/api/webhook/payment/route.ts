import * as z from 'zod';
import {
  acknowledgeFirstPayment,
  checkSignature,
  rejectFirstPayment,
} from '@azzapp/payment';
import { withPluginsRoute } from '#helpers/queries';

const paymentCallbackBody = z.object({
  MULTIPSP_UNIFIED_STATUS: z.string(),
  MULTIPSP_CLIENT_PAYMENT_REQUEST_ULID: z.string(),
  TRANSACTIONID: z.string(),
  MESSAGE: z.string().optional(),
  HASH: z.string(),
});

export const POST = withPluginsRoute(async (req: Request) => {
  const body = await req.json();

  if (!(await checkSignature(body, body.HASH))) {
    return new Response('hash mismatch', { status: 400 });
  }

  const data = paymentCallbackBody.parse(body);

  if (data.MULTIPSP_UNIFIED_STATUS === 'OK') {
    await acknowledgeFirstPayment(data.MULTIPSP_CLIENT_PAYMENT_REQUEST_ULID);
  } else {
    await rejectFirstPayment(
      data.MULTIPSP_CLIENT_PAYMENT_REQUEST_ULID,
      data.TRANSACTIONID,
      data.MESSAGE,
    );
  }

  return new Response('ok', { status: 200 });
});
