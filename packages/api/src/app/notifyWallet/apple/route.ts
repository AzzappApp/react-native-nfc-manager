import http2 from 'node:http2';
import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { deletePushToken } from '@azzapp/data';
import { checkServerAuth } from '@azzapp/service/serverAuthServices';
import ERRORS from '@azzapp/shared/errors';
import {
  APPLE_PASS_IDENTIFIER,
  SIGNER_CERT,
  SIGNER_KEY,
  SIGNER_KEY_PASSPHRASE,
} from '#helpers/pass/apple';
import { withPluginsRoute } from '#helpers/queries';
const NotifyApplePassWalletSchema = z.object({
  pushToken: z.string(),
});

const notifyApplePassWallet = async (pushToken: string) => {
  const response = await new Promise<Response>((resolve, reject) => {
    const client = http2.connect('https://api.push.apple.com', {
      key: SIGNER_KEY,
      cert: SIGNER_CERT,
      passphrase: SIGNER_KEY_PASSPHRASE,
    });

    const headers = {
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      'apns-topic': APPLE_PASS_IDENTIFIER,
      'content-type': 'application/json',
    };

    const body = JSON.stringify({});

    const request = client.request(headers);

    let responseData = '';
    let statusCode = 500; // Default to internal server error

    request.on('response', headers => {
      statusCode = headers[':status'] || 500; // Get the HTTP status code
    });

    request.on('data', chunk => {
      responseData += chunk;
    });

    request.on('end', () => {
      client.close();
      resolve(new Response(responseData, { status: statusCode }));
    });

    request.on('error', err => {
      client.close();
      reject(
        new Response(JSON.stringify({ error: err.message }), { status: 500 }),
      );
    });

    request.write(body);
    request.end();
  });

  if (response.status === 410) {
    await deletePushToken(pushToken);
    return {
      ok: true,
    } as const;
  }

  return response;
};

export const POST = withPluginsRoute(async (req: Request) => {
  try {
    await checkServerAuth(await headers());
    const body = await req.json();
    const input = NotifyApplePassWalletSchema.parse(body);

    const result = await notifyApplePassWallet(input.pushToken);

    if (result.ok) {
      return NextResponse.json(
        {
          message: 'sent',
        },
        {
          status: 200,
        },
      );
    } else {
      return NextResponse.json(
        {
          message: result.text(),
        },
        {
          status: result.status,
        },
      );
    }
  } catch (e) {
    Sentry.captureException(e);
    if ((e as Error).message === ERRORS.INVALID_TOKEN) {
      return NextResponse.json(
        { message: ERRORS.INVALID_TOKEN },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
});

export const runtime = 'nodejs';
