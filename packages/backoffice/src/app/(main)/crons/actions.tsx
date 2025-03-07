'use server';

export async function unpublishWebCards() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/cron/unpublishWebCards`,
    {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
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
    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/cron/removeUnusedMedia`,
    {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      method: 'GET',
    },
  );

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return response.ok;
}
