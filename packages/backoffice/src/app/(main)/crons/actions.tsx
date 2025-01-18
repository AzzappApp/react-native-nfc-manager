'use server';

export async function unpublishWebCards() {
  // Mutate data

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL}api/cron/unpublishWebCards`,
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
