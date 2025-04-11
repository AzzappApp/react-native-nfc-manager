import { waitUntil } from '@vercel/functions';
import { getVercelOidcToken } from '@vercel/functions/oidc';
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
      (async () => {
        await fetch(`${process.env.NEXT_PUBLIC_ENDPOINT}/api/revalidate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
            'x-vercel-protection-bypass':
              process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '',
          },
          body: JSON.stringify({
            cards,
            posts,
          }),
        });
      })(),
    );
  }
};
