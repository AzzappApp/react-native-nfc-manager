'use server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  CardTemplateTypeTable,
  db,
  saveLocalizationMessage,
} from '@azzapp/data';
import { createId } from '@azzapp/data/helpers/createId';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
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
      await db.transaction(async trx => {
        await db
          .update(CardTemplateTypeTable)
          .set({
            webCardCategoryId: data.webCardCategory.id,
            enabled: data.enabled,
          })
          .where(eq(CardTemplateTypeTable.id, id));

        await saveLocalizationMessage(
          {
            key: id,
            value: validation.data.label,
            locale: DEFAULT_LOCALE,
            target: ENTITY_TARGET,
          },
          trx,
        );
      });

      templateTypeId = data.id;
    } else {
      templateTypeId = createId();
      await db.transaction(async trx => {
        await trx.insert(CardTemplateTypeTable).values({
          id: templateTypeId,
          webCardCategoryId: data.webCardCategory.id,
          enabled: data.enabled,
        });

        await saveLocalizationMessage(
          {
            key: templateTypeId,
            value: validation.data.label,
            locale: DEFAULT_LOCALE,
            target: ENTITY_TARGET,
          },
          trx,
        );
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
