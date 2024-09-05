'use server';
import { revalidatePath } from 'next/cache';
import {
  createCompanyActivitiesType,
  saveLocalizationMessage,
  transaction,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import { companyActivitiesTypeSchema } from './companyActivitiesTypeSchema';

export const saveCompanyActivitiesType = async (data: {
  id?: string;
  label: string;
}): Promise<{
  success: boolean;
  formErrors?: any;
  message?: string;
  companyActivityId?: string;
}> => {
  const validation = companyActivitiesTypeSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      formErrors: validation.error.formErrors,
    } as const;
  }

  let companyActivitiesTypeId: string;
  try {
    companyActivitiesTypeId = await transaction(async () => {
      //check if WebCard Template type exist

      let companyActivityTypesId;

      if (data.id) {
        companyActivityTypesId = data.id;
      } else {
        const id = await createCompanyActivitiesType();
        companyActivityTypesId = id;
      }
      await saveLocalizationMessage({
        key: companyActivityTypesId,
        value: validation.data.label,
        locale: DEFAULT_LOCALE,
        target: ENTITY_TARGET,
      });
      return companyActivityTypesId;
    });
    revalidatePath(`/companyActivitiesTypes/[id]`);
    return {
      success: true,
      companyActivityId: companyActivitiesTypeId,
    } as const;
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Error while saving Company Activities Type',
    };
  }
};
