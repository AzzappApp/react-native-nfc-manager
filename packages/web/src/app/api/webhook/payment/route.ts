import * as z from 'zod';
import { getUserProfilesWithWebCard } from '@azzapp/data';
import { runWithPrimary } from '@azzapp/data/src/database/database';
import {
  acknowledgeFirstPayment,
  checkSignature,
  rejectFirstPayment,
} from '@azzapp/payment';
import { revalidateWebcardsAndPosts } from '#helpers/api';
import { sendInvoice } from '#helpers/paymentHelpers';
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

  let subscription;

  if (data.MULTIPSP_UNIFIED_STATUS === 'OK') {
    const result = await acknowledgeFirstPayment(
      data.MULTIPSP_CLIENT_PAYMENT_REQUEST_ULID,
      data.TRANSACTIONID,
      data.MESSAGE,
    );

    if (result) {
      subscription = result.subscription;

      if (result.paymentId) {
        await runWithPrimary(() =>
          sendInvoice({
            paymentId: result.paymentId!,
            subscription: result.subscription,
          }),
        );
      }
    }
  } else {
    subscription = await rejectFirstPayment(
      data.MULTIPSP_CLIENT_PAYMENT_REQUEST_ULID,
      data.TRANSACTIONID,
      data.MESSAGE,
    );
  }

  if (subscription) {
    const webCards = await getUserProfilesWithWebCard(
      subscription.userId,
      'owner',
    );

    revalidateWebcardsAndPosts(
      webCards
        .map(({ webCard }) => webCard.userName)
        .filter(userName => userName !== null),
    );
  }
  return new Response('ok', { status: 200 });
});
