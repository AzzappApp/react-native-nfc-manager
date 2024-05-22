// @TODO: temporary disable for feat_cover_v2
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
// @ts-nocheck
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
  getWebCardByUserName,
  referencesMedias,
} from '@azzapp/data';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateSchema } from './coverTemplateSchema';
import type { CoverTemplateFormValue } from './coverTemplateSchema';
import type { NewCoverTemplate } from '@azzapp/data';

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
    const coverTemplateData: NewCoverTemplate = {
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
        textAnimation: data.textAnimation,
        backgroundId: data.backgroundId,
        backgroundColor: data.backgroundColor,
        backgroundPatternColor: data.backgroundPatternColor,
        foregroundId: data.foregroundId,
        foregroundColor: data.foregroundColor,
        mediaFilter: data.mediaFilter,
        mediaAnimation: data.mediaAnimation,
        mediaParameters: data.mediaParameters as any,
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
  const webCard = await getWebCardByUserName(username);
  if (!webCard) {
    throw new Error('WebCard not found');
  }
  if (!webCard.coverData?.sourceMediaId) {
    throw new Error('Cover data not found');
  }
  const [media] = await getMediasByIds([webCard.coverData.sourceMediaId]);
  if (!media) {
    throw new Error('Media not found');
  }

  const colorPalette =
    webCard.cardColors &&
    (await getColorPaletteByColors(
      webCard.cardColors.primary,
      webCard.cardColors.dark,
      webCard.cardColors.light,
    ));

  return {
    kind: webCard.coverData.segmented
      ? 'people'
      : media.kind === 'image'
        ? 'others'
        : 'video',

    previewMedia: {
      id: media.id,
      kind: media.kind,
    },
    colorPaletteId: colorPalette?.id,
    titleFontSize: webCard.coverData.titleStyle?.fontSize,
    titleFontFamily: webCard.coverData.titleStyle?.fontFamily,
    titleColor: webCard.coverData.titleStyle?.color,
    subTitleFontSize: webCard.coverData.subTitleStyle?.fontSize,
    subTitleFontFamily: webCard.coverData.subTitleStyle?.fontFamily,
    subTitleColor: webCard.coverData.subTitleStyle?.color,
    textOrientation: webCard.coverData.textOrientation,
    textPosition: webCard.coverData.textPosition,
    textAnimation: webCard.coverData.textAnimation,
    backgroundId: webCard.coverData.backgroundId,
    backgroundColor: webCard.coverData.backgroundColor,
    backgroundPatternColor: webCard.coverData.backgroundPatternColor,
    foregroundId: webCard.coverData.foregroundId,
    foregroundColor: webCard.coverData.foregroundColor,
    mediaFilter: webCard.coverData.mediaFilter,
    mediaAnimation: webCard.coverData.mediaAnimation,
    mediaParameters: webCard.coverData.mediaParameters,
  } as const;
};
