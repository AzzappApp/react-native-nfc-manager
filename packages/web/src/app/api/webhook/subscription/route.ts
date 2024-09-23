import * as z from 'zod';
import {
  acknowledgeRecurringPayment,
  checkSignature,
  rejectRecurringPayment,
} from '@azzapp/payment';
import { withPluginsRoute } from '#helpers/queries';

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
    HASH: z.string().optional(),
  }),
});

export const POST = withPluginsRoute(async (req: Request) => {
  const json = await req.json();

  const data = subscriptionPostSchema.parse(json);

  if ('HASH' in data.json) {
    if (!data.json.HASH || !(await checkSignature(data.json, data.json.HASH))) {
      return new Response('hash mismatch', { status: 400 });
    }
  }

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
