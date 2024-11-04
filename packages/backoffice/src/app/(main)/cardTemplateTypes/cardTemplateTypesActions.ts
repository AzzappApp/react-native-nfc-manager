'use server';
import { revalidatePath } from 'next/cache';
import {
  createCardTemplateType,
  saveLocalizationMessage,
  transaction,
  updateCardTemplateType,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { cardTemplateTypeSchema } from './cardTemplateTypeSchema';
import type {
  CardTemplateType,
  NewCardTemplateType,
  WebCardCategory,
} from '@azzapp/data';

export const saveCardTemplateType = async (
  data: { webCardCategory: WebCardCategory } & (
    | CardTemplateType
    | NewCardTemplateType
  ),
): Promise<{
  success: boolean;
  formErrors?: any;
  message?: string;
  id?: string;
}> => {
  const validation = cardTemplateTypeSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      formErrors: validation.error.formErrors,
    } as const;
  }
  let templateTypeId: string;
  try {
    //check if WebCard Template type exist
    if (data.id) {
      const id = data.id;
      await transaction(async () => {
        await updateCardTemplateType(id, {
          webCardCategoryId: data.webCardCategory.id,
          enabled: data.enabled,
        });

        await saveLocalizationMessage({
          key: id,
          value: validation.data.label,
          locale: DEFAULT_LOCALE,
        });
      });

      templateTypeId = data.id;
    } else {
      templateTypeId = await transaction(async () => {
        const id = await createCardTemplateType({
          id: templateTypeId,
          webCardCategoryId: data.webCardCategory.id,
          enabled: data.enabled,
        });

        await saveLocalizationMessage({
          key: id,
          value: validation.data.label,
          locale: DEFAULT_LOCALE,
        });
        return id;
      });
    }
    revalidatePath(`/cardTemplateTypes/[id]`);
    return { success: true, id: templateTypeId } as const;
  } catch (e: any) {
    console.log(e.message);
    return {
      success: false,
      message: e.message || 'Something went wrong',
    };
  }
};
