import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import {
  acknowledgeRecurringPayment,
  rejectRecurringPayment,
} from '@azzapp/payment';

const subscriptionPostSchema = z.object({
  json: z.object({
    action: z.literal('rmanagerRebill'),
    transaction_id: z.string(),
    transaction_status: z.string(),
    amount_cnts: z.string(),
    transaction_currency: z.string(),
    status: z.string(),
    rebill_manager_id: z.string(),
    rebill_manager_external_reference: z.string(),
    provider_response: z.string(),
    rebill_manager_state: z.string(),
  }),
});

export const POST = withAxiom(async (req: Request) => {
  const json = await req.json();

  const data = subscriptionPostSchema.parse(json);

  if (data.json.status === 'OK') {
    await acknowledgeRecurringPayment(
      data.json.rebill_manager_external_reference,
      data.json.transaction_id,
      data.json.provider_response,
    );
  } else {
    await rejectRecurringPayment(
      data.json.rebill_manager_external_reference,
      data.json.rebill_manager_state === 'ON',
      data.json.transaction_id,
      data.json.provider_response,
    );
  }

  return new Response('ok', { status: 200 });
});
