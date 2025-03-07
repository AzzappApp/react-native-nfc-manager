import * as z from 'zod';
import { getUserProfilesWithWebCard } from '@azzapp/data';
import { runWithPrimary } from '@azzapp/data/src/database/database';
import {
  acknowledgeRecurringPayment,
  checkSignature,
  rejectRecurringPayment,
} from '@azzapp/payment';
import { revalidateWebcardsAndPosts } from '#helpers/api';
import { sendInvoice } from '#helpers/paymentHelpers';
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

  let subscription;

  if (data.status === 'OK') {
    const result = await acknowledgeRecurringPayment(
      data.rebill_manager_external_reference,
      data.rebill_manager_id,
      data.transaction_id,
      parseInt(data.amount_cnts, 10),
      data.provider_response,
    );
    subscription = result.subscription;
    const paymentId = result.paymentId;
    if (paymentId) {
      await runWithPrimary(() =>
        sendInvoice({ paymentId, subscription: result.subscription }),
      );
    }
  } else {
    subscription = await rejectRecurringPayment(
      data.rebill_manager_external_reference,
      data.transaction_id,
      data.provider_response,
    );
  }

  if (subscription) {
    const webcards = await getUserProfilesWithWebCard(
      subscription.userId,
      'owner',
    );
    revalidateWebcardsAndPosts(
      webcards
        .map(({ webCard }) => webCard.userName)
        .filter(value => value !== null),
    );
  }

  return new Response('ok', { status: 200 });
});
