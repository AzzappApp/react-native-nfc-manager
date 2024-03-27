'use server';

import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  PostCommentTable,
  PostTable,
  WebCardTable,
  db,
} from '@azzapp/data/domains';
import { ReportTable } from '@azzapp/data/domains/report';
import { getSession } from '#helpers/session';
import type { TargetType } from '@azzapp/data/domains/report';

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
        case 'comment':
          await trx
            .update(PostCommentTable)
            .set({
              deletedAt: new Date(),
              deletedBy: session.userId,
              deleted: true,
            })
            .where(eq(PostCommentTable.id, targetId));

          break;
        case 'post':
          await trx
            .update(PostTable)
            .set({
              deletedAt: new Date(),
              deletedBy: session.userId,
              deleted: true,
            })
            .where(eq(PostTable.id, targetId));
          break;
        case 'webCard':
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
            .update(WebCardTable)
            .set({
              nbFollowers: sql`GREATEST(nbFollowers - 1, 0)`,
            })
            .where(
              inArray(
                WebCardTable.id,
                sql`(select followingId from Follow where followerId = "${targetId}")`,
              ),
            );

          break;
      }
    });
  }
  revalidatePath('/reports/[targetType]/[targetId]');
};
