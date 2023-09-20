'use server';

import { createId } from '@paralleldrive/cuid2';
import { eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  MediaSuggestionTable,
  MediaTable,
  checkMedias,
  db,
} from '@azzapp/data/domains';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import type { MediaSuggestion, NewMediaSuggestion } from '@azzapp/data/domains';

export const addSuggestions = async ({
  medias,
  categories,
  activities,
}: {
  medias: string[];
  categories: string[];
  activities: string[];
}) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }

  try {
    await checkMedias(medias);

    await db.transaction(async trx => {
      await trx
        .update(MediaTable)
        .set({ refCount: categories.length + activities.length })
        .where(
          inArray(
            MediaTable.id,
            medias.map(mediaId => mediaId),
          ),
        );

      const suggestions: MediaSuggestion[] = [
        ...categories.flatMap(categoryId =>
          medias.map(media => ({
            id: createId(),
            mediaId: media,
            profileCategoryId: categoryId,
            companyActivityId: null,
          })),
        ),
        ...activities.flatMap(activityId =>
          medias.map(media => ({
            id: createId(),
            mediaId: media,
            profileCategoryId: null,
            companyActivityId: activityId,
          })),
        ),
      ];

      await trx.insert(MediaSuggestionTable).values(suggestions);
    });
  } catch (error) {
    console.error(error);
    throw new Error('Error while saving suggestions');
  }

  revalidatePath(`/suggestedMedias`);
  return { success: true } as const;
};

export const setSuggestionsForMedia = async ({
  mediaId,
  categories,
  activities,
}: {
  mediaId: string;
  categories: string[];
  activities: string[];
}) => {
  const oldSuggestions = await db
    .select()
    .from(MediaSuggestionTable)
    .where(eq(MediaSuggestionTable.mediaId, mediaId));

  const refCountUpdate =
    categories.length + activities.length - oldSuggestions.length;

  try {
    await db.transaction(async trx => {
      const suggestions: NewMediaSuggestion[] = [
        ...categories.map(categoryId => ({
          mediaId,
          profileCategoryId: categoryId,
          companyActivityId: null,
        })),
        ...activities.map(activityId => ({
          mediaId,
          profileCategoryId: null,
          companyActivityId: activityId,
        })),
      ];

      await trx
        .update(MediaTable)
        .set({ refCount: sql`refCount + ${refCountUpdate}` })
        .where(eq(MediaTable.id, mediaId));

      await trx.insert(MediaSuggestionTable).values(suggestions);

      await trx.delete(MediaSuggestionTable).where(
        inArray(
          MediaSuggestionTable.id,
          oldSuggestions.map(s => s.id),
        ),
      );
    });
  } catch (error) {
    console.error(error);
    throw new Error('Error while saving suggestions');
  }

  revalidatePath(`/suggestedMedias`);
  return { success: true } as const;
};
