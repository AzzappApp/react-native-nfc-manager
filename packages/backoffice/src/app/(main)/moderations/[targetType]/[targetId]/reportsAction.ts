'use server';

import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  PostCommentTable,
  PostTable,
  WebCardTable,
  db,
  ReportTable,
  ProfileTable,
} from '@azzapp/data';
import { getSession } from '#helpers/session';
import type { TargetType } from '@azzapp/data';

const AZZAPP_SERVER_HEADER = 'azzapp-server-auth';

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
  revalidatePath('/reports/[targetType]/[targetId]');
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

                await fetch(
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
          await trx
            .update(PostTable)
            .set({
              deletedAt: new Date(),
              deletedBy: session.userId,
              deleted: true,
            })
            .where(eq(PostTable.id, targetId));

          try {
            const post = await trx
              .select()
              .from(PostTable)
              .where(eq(PostTable.id, targetId));
            if (post.length > 0) {
              const webCard = await trx
                .select()
                .from(WebCardTable)
                .where(eq(WebCardTable.id, post[0].webCardId));

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
          await trx
            .update(WebCardTable)
            .set({
              deletedAt: new Date(),
              deletedBy: session.userId,
              deleted: true,
              cardIsPublished: false,
            })
            .where(eq(WebCardTable.id, targetId));

          await trx
            .update(ProfileTable)
            .set({
              deletedAt: new Date(),
              deletedBy: session.userId,
              deleted: true,
            })
            .where(eq(ProfileTable.webCardId, targetId));

          await trx
            .update(WebCardTable)
            .set({
              nbFollowers: sql`GREATEST(nbFollowers - 1, 0)`,
            })
            .where(
              inArray(
                WebCardTable.id,
                sql`(select followingId from Follow where followerId = ${targetId})`,
              ),
            );

          await trx
            .update(WebCardTable)
            .set({
              nbFollowings: sql`GREATEST(nbFollowings - 1, 0)`,
            })
            .where(
              inArray(
                WebCardTable.id,
                sql`(select followerId from Follow where followingId = ${targetId})`,
              ),
            );

          try {
            const webCard = await trx
              .select()
              .from(WebCardTable)
              .where(eq(WebCardTable.id, targetId));

            await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/revalidate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                [AZZAPP_SERVER_HEADER]: process.env.API_SERVER_TOKEN ?? '',
              },
              body: JSON.stringify({
                cards: webCard.map(({ userName }) => userName),
              }),
            });
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
