import { waitUntil } from '@vercel/functions';
import { getVercelOidcToken } from '@vercel/functions/oidc';
import { AZZAPP_SERVER_HEADER, buildWebUrl } from '@azzapp/shared/urlHelpers';
import env from '#env';

export const revalidateWebcardsAndPosts = (
  cards: string[],
  posts: Array<{
    userName: string;
    id: string;
  }> = [],
) => {
  if (posts.length || cards.length) {
    waitUntil(
      (async () => {
        await fetch(buildWebUrl('/api/revalidate'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
            'x-vercel-protection-bypass': env.VERCEL_AUTOMATION_BYPASS_SECRET,
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
