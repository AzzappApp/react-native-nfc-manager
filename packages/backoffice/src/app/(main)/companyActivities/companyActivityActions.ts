'use server';
import { revalidatePath } from 'next/cache';
import {
  createCompanyActivity,
  saveLocalizationMessage,
  transaction,
  updateCompanyActivity,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { companyActivitySchema } from './companyActivitySchema';

export const saveCompanyActivity = async (data: {
  id?: string;
  label: string;
  cardTemplateTypeId: string | null;
  companyActivityTypeId: string | null;
}): Promise<{
  success: boolean;
  formErrors?: any;
  message?: string;
  companyActivityId?: string;
}> => {
  const validation = companyActivitySchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      formErrors: validation.error.formErrors,
    } as const;
  }

  let companyActivityId: string;
  try {
    companyActivityId = await transaction(async () => {
      let companyActivityId;

      if (data.id) {
        await updateCompanyActivity(data.id, {
          cardTemplateTypeId: data.cardTemplateTypeId ?? null,
          companyActivityTypeId: data.companyActivityTypeId ?? null,
        });

        await saveLocalizationMessage({
          key: data.id,
          value: validation.data.label,
          locale: DEFAULT_LOCALE,
        });

        companyActivityId = data.id;
      } else {
        const id = await createCompanyActivity({
          cardTemplateTypeId: data.cardTemplateTypeId ?? null,
          companyActivityTypeId: data.companyActivityTypeId ?? null,
        });

        await saveLocalizationMessage({
          key: id,
          value: validation.data.label,
          locale: DEFAULT_LOCALE,
        });

        companyActivityId = id;
      }

      return companyActivityId;
    });
    revalidatePath(`/companyActivities/[id]`);
    return { success: true, companyActivityId } as const;
  } catch (e: any) {
    console.error(e);
    return {
      success: false,
      message: e.message || 'Something went wrong',
    };
  }
};
