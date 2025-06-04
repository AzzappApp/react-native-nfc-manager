'use server';

import { getVercelOidcToken } from '@vercel/functions/oidc';
import { revalidatePath } from 'next/cache';
import {
  markWebCardAsDeleted,
  markReportsAsTreated,
  transaction,
  markPostCommentAsDeleted,
  getPostCommentById,
  getPostById,
  getWebCardById,
  markPostAsDeleted,
} from '@azzapp/data';
import { AZZAPP_SERVER_HEADER, buildWebUrl } from '@azzapp/shared/urlHelpers';
import { getSession } from '#helpers/session';
import type { ReportTargetType } from '@azzapp/data';

export const ignoreReport = async (
  targetId: string,
  targetType: ReportTargetType,
) => {
  const session = await getSession();

  if (session?.userId) {
    await markReportsAsTreated(targetId, targetType, session.userId);
  }
  revalidatePath(`/reports/${targetType}/${targetId}`);
};

export const deleteRelatedItem = async (
  targetId: string,
  targetType: ReportTargetType,
) => {
  const session = await getSession();

  if (session?.userId) {
    await transaction(async () => {
      await markReportsAsTreated(targetId, targetType, session.userId);

      switch (targetType) {
        case 'comment': {
          await markPostCommentAsDeleted(targetId, session.userId);

          const postComment = await getPostCommentById(targetId);

          if (postComment) {
            try {
              const post = await getPostById(postComment.postId);
              if (post) {
                const webCard = await getWebCardById(post.webCardId);
                if (webCard) {
                  const res = await fetch(buildWebUrl('/api/revalidate'), {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
                    },
                    body: JSON.stringify({
                      cards: [webCard.userName],
                      posts: [{ userName: webCard.userName, id: post.id }],
                    }),
                  });
                  if (!res.ok) {
                    console.error('Error revalidating pages');
                  }
                }
              }
            } catch {
              console.error('Error revalidating pages');
            }
          }

          break;
        }
        case 'post': {
          try {
            const post = await markPostAsDeleted(targetId, session.userId);

            if (post) {
              const webCard = await getWebCardById(post.webCardId);
              if (webCard) {
                await fetch(buildWebUrl('/api/revalidate'), {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
                  },
                  body: JSON.stringify({
                    cards: [webCard.userName],
                    posts: [{ userName: webCard.userName, id: post.id }],
                  }),
                });
              }
            }
          } catch {
            console.error('Error revalidating pages');
          }

          break;
        }

        case 'webCard': {
          await markWebCardAsDeleted(targetId, session.userId);

          try {
            const webCard = await getWebCardById(targetId);
            if (!webCard) {
              return;
            }
            const res = await fetch(buildWebUrl('/api/revalidate'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                [AZZAPP_SERVER_HEADER]: `Bearer ${await getVercelOidcToken()}`,
              },
              body: JSON.stringify({
                cards: [webCard.userName],
                posts: [],
              }),
            });

            if (!res.ok) {
              console.error('Error revalidating pages');
            }
          } catch {
            console.error('Error revalidating pages');
          }

          break;
        }
      }
    });
  }
  revalidatePath('/reports/[targetType]/[targetId]');
};
