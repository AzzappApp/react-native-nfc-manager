import * as z from 'zod';
import {
  acknowledgeRecurringPayment,
  checkSignature,
  rejectRecurringPayment,
} from '@azzapp/payment';
import { withPluginsRoute } from '#helpers/queries';

const subscriptionPostSchema = z.object({
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
  HASH: z.string(),
});

export const POST = withPluginsRoute(async (req: Request) => {
  const json = await req.json();

  const data = subscriptionPostSchema.parse(json);

  if (!(await checkSignature(json, data.HASH))) {
    return new Response('hash mismatch', { status: 400 });
  }

  if (data.status === 'OK') {
    await acknowledgeRecurringPayment(
      data.rebill_manager_external_reference,
      data.transaction_id,
      data.provider_response,
    );
  } else {
    await rejectRecurringPayment(
      data.rebill_manager_external_reference,
      data.rebill_manager_state === 'ON',
      data.transaction_id,
      data.provider_response,
    );
  }

  return new Response('ok', { status: 200 });
});
