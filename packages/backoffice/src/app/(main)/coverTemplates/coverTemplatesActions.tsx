'use server';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

import { revalidatePath } from 'next/cache';
import {
  CoverTemplateTable,
  checkMedias,
  db,
  getColorPaletteByColors,
  getCoverTemplateById,
  getMediasByIds,
  getProfileByUserName,
  referencesMedias,
} from '@azzapp/data/domains';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateSchema } from './coverTemplateSchema';
import type { CoverTemplateFormValue } from './coverTemplateSchema';
import type { CoverTemplate } from '@azzapp/data/domains';

export const saveCoverTemplate = async (
  data: CoverTemplateFormValue & { id?: string },
) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = coverTemplateSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }

  await checkMedias([data.previewMedia.id]);

  const coverTemplateId = await db.transaction(async trx => {
    const coverTemplateData: Omit<CoverTemplate, 'id'> = {
      name: data.name,
      kind: data.kind,
      previewMediaId: data.previewMedia.id,
      colorPaletteId: data.colorPaletteId,
      businessEnabled: data.businessEnabled,
      personalEnabled: data.personalEnabled,
      data: {
        titleStyle: {
          fontSize: data.titleFontSize,
          fontFamily: data.titleFontFamily,
          color: data.titleColor,
        },
        subTitleStyle: {
          fontSize: data.subTitleFontSize,
          fontFamily: data.subTitleFontFamily,
          color: data.subTitleColor,
        },
        textOrientation: data.textOrientation,
        textPosition: data.textPosition,
        backgroundId: data.backgroundId,
        backgroundColor: data.backgroundColor,
        backgroundPatternColor: data.backgroundPatternColor,
        foregroundId: data.foregroundId,
        foregroundColor: data.foregroundColor,
        mediaFilter: data.mediaFilter,
        mediaParameters: data.mediaParameters as any,
        merged: data.merged,
      },
    };

    let previousMediaId: string | null = null;
    let coverTemplateId: string;
    if (data.id) {
      const coverTemplate = await getCoverTemplateById(data.id);

      if (!coverTemplate) {
        throw new Error('Cover template not found');
      }

      previousMediaId = coverTemplate.previewMediaId;
      coverTemplateId = coverTemplate.id;

      await trx
        .update(CoverTemplateTable)
        .set(coverTemplateData)
        .where(eq(CoverTemplateTable.id, data.id));
    } else {
      coverTemplateId = createId();
      await trx.insert(CoverTemplateTable).values({
        id: coverTemplateId,
        ...coverTemplateData,
      });
    }

    await referencesMedias([data.previewMedia.id], [previousMediaId], trx);

    return coverTemplateId;
  });

  revalidatePath(`/coverTemplates/[id]`);
  return { success: true, coverTemplateId } as const;
};

export const getCoverData = async (username: string) => {
  const profile = await getProfileByUserName(username);
  if (!profile) {
    throw new Error('Profile not found');
  }
  if (!profile.coverData?.sourceMediaId) {
    throw new Error('Cover data not found');
  }
  const [media] = await getMediasByIds([profile.coverData.sourceMediaId]);
  if (!media) {
    throw new Error('Media not found');
  }

  const colorPalette =
    profile.cardColors &&
    (await getColorPaletteByColors(
      profile.cardColors.primary,
      profile.cardColors.dark,
      profile.cardColors.light,
    ));

  return {
    kind: profile.coverData.segmented
      ? 'people'
      : media.kind === 'image'
      ? 'others'
      : 'video',

    previewMedia: {
      id: media.id,
      kind: media.kind,
    },
    colorPaletteId: colorPalette?.id,
    titleFontSize: profile.coverData.titleStyle?.fontSize,
    titleFontFamily: profile.coverData.titleStyle?.fontFamily,
    titleColor: profile.coverData.titleStyle?.color,
    subTitleFontSize: profile.coverData.subTitleStyle?.fontSize,
    subTitleFontFamily: profile.coverData.subTitleStyle?.fontFamily,
    subTitleColor: profile.coverData.subTitleStyle?.color,
    textOrientation: profile.coverData.textOrientation,
    textPosition: profile.coverData.textPosition,
    backgroundId: profile.coverData.backgroundId,
    backgroundColor: profile.coverData.backgroundColor,
    backgroundPatternColor: profile.coverData.backgroundPatternColor,
    foregroundId: profile.coverData.foregroundId,
    foregroundColor: profile.coverData.foregroundColor,
    mediaFilter: profile.coverData.mediaFilter,
    mediaParameters: profile.coverData.mediaParameters,
    merged: profile.coverData.merged,
  } as const;
};
