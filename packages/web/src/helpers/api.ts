import { waitUntil } from '@vercel/functions';
import { AZZAPP_SERVER_HEADER } from '@azzapp/shared/urlHelpers';

export const revalidateWebcardsAndPosts = (
  cards: string[],
  posts: Array<{
    userName: string;
    id: string;
  }> = [],
) => {
  if (cards.length || posts.length) {
    waitUntil(
      fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
          'x-vercel-protection-bypass':
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '',
        },
        body: JSON.stringify({
          cards,
          posts,
        }),
      }),
    );
  }
};
