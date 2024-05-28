'use server';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  PostCommentTable,
  PostTable,
  WebCardTable,
  db,
  ReportTable,
  deletePost,
  deleteWebCard,
} from '@azzapp/data';
import { AZZAPP_SERVER_HEADER } from '@azzapp/shared/urlHelpers';
import { getSession } from '#helpers/session';
import type { TargetType } from '@azzapp/data';

export const ignoreReport = async (
  targetId: string,
  targetType: TargetType,
) => {
  const session = await getSession();

  if (session?.userId) {
    await db
      .update(ReportTable)
      .set({ treatedBy: session.userId, treatedAt: new Date() })
      .where(
        and(
          eq(ReportTable.targetId, targetId),
          eq(ReportTable.targetType, targetType),
          isNull(ReportTable.treatedBy),
        ),
      );
  }
  revalidatePath(`/reports/${targetType}/${targetId}`);
};

export const deleteRelatedItem = async (
  targetId: string,
  targetType: TargetType,
) => {
  const session = await getSession();

  if (session?.userId) {
    await db.transaction(async trx => {
      await trx
        .update(ReportTable)
        .set({ treatedBy: session.userId, treatedAt: new Date() })
        .where(
          and(
            eq(ReportTable.targetId, targetId),
            eq(ReportTable.targetType, targetType),
            isNull(ReportTable.treatedBy),
          ),
        );

      switch (targetType) {
        case 'comment': {
          await trx
            .update(PostCommentTable)
            .set({
              deletedAt: new Date(),
              deletedBy: session.userId,
              deleted: true,
            })
            .where(eq(PostCommentTable.id, targetId));

          const postComment = await trx
            .select()
            .from(PostCommentTable)
            .where(eq(PostCommentTable.id, targetId));

          if (postComment.length > 0) {
            try {
              const post = await trx
                .select()
                .from(PostTable)
                .where(eq(PostTable.id, postComment[0].postId));
              if (post.length > 0) {
                const webCard = await trx
                  .select()
                  .from(WebCardTable)
                  .where(eq(WebCardTable.id, post[0].webCardId));

                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_ENDPOINT}/revalidate`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      [AZZAPP_SERVER_HEADER]:
                        process.env.API_SERVER_TOKEN ?? '',
                    },
                    body: JSON.stringify({
                      cards: webCard.map(({ userName }) => userName),
                      posts: webCard.map(({ userName }) => ({
                        userName,
                        id: targetId,
                      })),
                    }),
                  },
                );
                if (!res.ok) {
                  console.error('Error revalidating pages');
                }
              }
            } catch (e) {
              console.error('Error revalidating pages');
            }

            await trx
              .update(PostTable)
              .set({
                counterComments: sql`GREATEST(counterComments - 1, 0)`,
              })
              .where(eq(PostTable.id, postComment[0].postId));
          }

          break;
        }
        case 'post': {
          try {
            const post = await deletePost(targetId, session.userId, trx);

            if (post) {
              const webCard = await trx
                .select()
                .from(WebCardTable)
                .where(eq(WebCardTable.id, post.webCardId));

              await fetch(
                `${process.env.NEXT_PUBLIC_API_ENDPOINT}/revalidate`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
                  },
                  body: JSON.stringify({
                    cards: webCard.map(({ userName }) => userName),
                    posts: webCard.map(({ userName }) => ({
                      userName,
                      id: targetId,
                    })),
                  }),
                },
              );
            }
          } catch (e) {
            console.error('Error revalidating pages');
          }

          break;
        }

        case 'webCard': {
          await deleteWebCard(targetId, session.userId, trx);

          try {
            const webCard = await trx
              .select()
              .from(WebCardTable)
              .where(eq(WebCardTable.id, targetId));

            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_ENDPOINT}/revalidate`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
                },
                body: JSON.stringify({
                  cards: webCard.map(({ userName }) => userName),
                  posts: [],
                }),
              },
            );

            if (!res.ok) {
              console.error('Error revalidating pages');
            }
          } catch (e) {
            console.error('Error revalidating pages');
          }

          break;
        }
      }
    });
  }
  revalidatePath('/reports/[targetType]/[targetId]');
};
