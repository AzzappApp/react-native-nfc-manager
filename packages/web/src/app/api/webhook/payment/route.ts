import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import {
  acknowledgeFirstPayment,
  checkSignature,
  rejectFirstPayment,
} from '@azzapp/payment';

const paymentCallbackBody = z.object({
  transaction_status: z.string(),
  client_reference: z.string(),
  transaction_id: z.string(),
  provider_response: z.string().optional(),
  HASH: z.string().optional(),
});

export const GET = withAxiom(async (req: Request) => {
  console.log('GET /api/webhook/payment');
  console.log(JSON.stringify(req.headers, null, 2));
  const { searchParams } = new URL(req.url);
  console.log(JSON.stringify(searchParams, null, 2));
  return new Response('ok', { status: 200 });
});

export const POST = withAxiom(async (req: Request) => {
  const body = await req.json();

  if ('HASH' in body) {
    if (!body.HASH || !(await checkSignature(body, body.HASH))) {
      return new Response('hash mismatch', { status: 400 });
    }
  }

  const data = paymentCallbackBody.parse(body);

  if (data.transaction_status === 'OK') {
    await acknowledgeFirstPayment(
      data.client_reference,
      data.transaction_id,
      data.provider_response,
    );
  } else {
    await rejectFirstPayment(
      data.client_reference,
      data.transaction_id,
      data.provider_response,
    );
  }

  return new Response('ok', { status: 200 });
});
