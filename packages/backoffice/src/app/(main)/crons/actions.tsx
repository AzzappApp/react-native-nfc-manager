'use server';

import env from '#env';

export async function unpublishWebCards() {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_ENDPOINT}/cron/unpublishWebCards`,
    {
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
      },
      method: 'GET',
    },
  );

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return response.ok;
}

export async function removeUnusedMedia() {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_ENDPOINT}/cron/removeUnusedMedia`,
    {
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
      },
      method: 'GET',
    },
  );

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return response.ok;
}
