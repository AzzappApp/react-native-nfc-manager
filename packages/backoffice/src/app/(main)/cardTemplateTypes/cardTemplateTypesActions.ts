'use server';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { CardTemplateTypeTable, db } from '@azzapp/data/domains';
import { cardTemplateTypeSchema } from './cardTemplateTypeSchema';
import type {
  CardTemplateType,
  NewCardTemplateType,
  ProfileCategory,
} from '@azzapp/data/domains';

export const saveCardTemplateType = async (
  data: { profileCategory: ProfileCategory } & (
    | CardTemplateType
    | NewCardTemplateType
  ),
) => {
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
      await db
        .update(CardTemplateTypeTable)
        .set({
          labels: data.labels,
          profileCategoryId: data.profileCategory.id,
        })
        .where(eq(CardTemplateTypeTable.id, data.id));

      templateTypeId = data.id;
    } else {
      templateTypeId = createId();
      await db.insert(CardTemplateTypeTable).values({
        id: templateTypeId,
        labels: data.labels,
        profileCategoryId: data.profileCategory.id,
      });
    }
  } catch (error) {
    throw new Error('Error while saving Card Template Type');
  }

  revalidatePath(`/cardTemplateTypes/[id]`);
  return { success: true, id: templateTypeId } as const;
};
