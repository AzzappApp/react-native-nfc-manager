'use server';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  db,
  createLabel,
  getCoverTemplateTagById,
  CoverTemplateTagTable,
} from '@azzapp/data';
import { ADMIN } from '#roles';
import { saveLabelKey } from '#helpers/lokaliseHelpers';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateTagsSchema } from './coverTemplateTagsSchema';
import type {
  Label,
  CoverTemplateTag,
  NewCoverTemplateTag,
} from '@azzapp/data';

export const saveCoverTemplateTag = async (
  data: Label & (CoverTemplateTag | NewCoverTemplateTag),
) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = coverTemplateTagsSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }
  let coverTemplateTagId: string;

  try {
    coverTemplateTagId = await db.transaction(async trx => {
      const { id, baseLabelValue, ...coverTemplateTagData } = data;

      let coverTemplateTagId: string;
      if (id) {
        const oldCoverTemplateTag = await getCoverTemplateTagById(id);
        if (!oldCoverTemplateTag) {
          throw new Error('cover template tag not found');
        }

        coverTemplateTagId = id;
        await trx
          .update(CoverTemplateTagTable)
          .set(coverTemplateTagData)
          .where(eq(CoverTemplateTagTable.id, id));

        await createLabel(
          {
            labelKey: data.labelKey,
            baseLabelValue: data.baseLabelValue,
            translations: {},
          },
          trx,
        );
      } else {
        coverTemplateTagId = createId();
        await trx.insert(CoverTemplateTagTable).values({
          ...coverTemplateTagData,
          id: coverTemplateTagId,
        });

        await createLabel(
          {
            labelKey: data.labelKey,
            baseLabelValue: data.baseLabelValue,
            translations: {},
          },
          trx,
        );
      }

      await saveLabelKey({
        labelKey: data.labelKey,
        baseLabelValue: data.baseLabelValue,
      });

      return coverTemplateTagId;
    });
  } catch (e) {
    throw new Error('Error while saving cover template tag');
  }

  revalidatePath(`/coverTemplateFilters/[id]`, 'layout');
  return { success: true, coverTemplateTagId } as const;
};
