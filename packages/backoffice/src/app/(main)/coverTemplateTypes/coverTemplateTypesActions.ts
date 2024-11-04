'use server';
import { revalidatePath } from 'next/cache';
import {
  getCoverTemplateTypeById,
  saveLocalizationMessage,
  transaction,
  updateCoverTemplateType,
  createCoverTemplateType,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateTypesSchema } from './coverTemplateTypesSchema';
import type { CoverTemplateType, NewCoverTemplateType } from '@azzapp/data';

export const saveCoverTemplateType = async (
  data: { label: string } & (CoverTemplateType | NewCoverTemplateType),
): Promise<{
  success: boolean;
  formErrors?: any;
  message?: string;
  coverTemplateTypeId?: string;
}> => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = coverTemplateTypesSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    };
  }
  let coverTemplateTypeId: string;

  try {
    coverTemplateTypeId = await transaction(async () => {
      const { id, label, ...coverTemplateTypeData } = data;

      let coverTemplateTypeId: string;
      if (id) {
        const oldCoverTemplateType = await getCoverTemplateTypeById(id);
        if (!oldCoverTemplateType) {
          throw new Error('cover template type not found');
        }

        coverTemplateTypeId = id;
        await updateCoverTemplateType(
          coverTemplateTypeId,
          coverTemplateTypeData,
        );
      } else {
        coverTemplateTypeId = await createCoverTemplateType(data);
      }

      await saveLocalizationMessage({
        key: coverTemplateTypeId,
        value: label,
        locale: DEFAULT_LOCALE,
      });

      return coverTemplateTypeId;
    });

    revalidatePath(`/coverTemplateTypes/[id]`, 'layout');
    return { success: true, coverTemplateTypeId };
  } catch (e: any) {
    console.error(e);
    return {
      success: false,
      message: e.message || 'Something went wrong',
    };
  }
};
