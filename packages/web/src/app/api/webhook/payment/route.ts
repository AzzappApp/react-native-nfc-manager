import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import { acknowledgeFirstPayment, rejectFirstPayment } from '@azzapp/payment';

const paymentCallbackBody = z.object({
  transaction_status: z.string(),
  client_reference: z.string(),
  transaction_id: z.string(),
  provider_response: z.string().optional(),
});

export const POST = withAxiom(async (req: Request) => {
  const body = await req.json();

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
