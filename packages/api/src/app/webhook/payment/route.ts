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
  EXTRADATA: z.string().optional(),
  ALIAS: z.string(),
  MULTIPSP_PSP_ACCOUNT_ULID: z.string(),
});

export const POST = withPluginsRoute(async (req: Request) => {
  const body = await req.json();

  if (!(await checkSignature(body, body.HASH))) {
    return new Response('hash mismatch', { status: 400 });
  }

  const data = paymentCallbackBody.parse(body);

  let subscription;

  if (data.MULTIPSP_UNIFIED_STATUS === 'OK') {
    const extraData = JSON.parse(data.EXTRADATA || '{}');

    const result = await acknowledgeFirstPayment({
      paymentMeanId: data.MULTIPSP_CLIENT_PAYMENT_REQUEST_ULID,
      transactionId: data.TRANSACTIONID,
      paymentProviderResponse: data.MESSAGE,
      webCardId: extraData.webCardId,
      pspAccountId: data.MULTIPSP_PSP_ACCOUNT_ULID,
      transactionAlias: data.ALIAS,
    });

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
