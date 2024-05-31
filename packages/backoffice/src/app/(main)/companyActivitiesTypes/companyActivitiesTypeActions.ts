'use server';
import { revalidatePath } from 'next/cache';
import {
  createCompanyActivitiesType,
  createLabel,
  db,
  updateCompanyActivityType,
  type CompanyActivityType,
  type NewCompanyActivityType,
} from '@azzapp/data';
import { saveLabelKey } from '#helpers/lokaliseHelpers';
import { companyActivitiesTypeSchema } from './companyActivitiesTypeSchema';

export const saveCompanyActivitiesType = async (
  data: { cardTemplateType?: { id: string } } & (
    | CompanyActivityType
    | NewCompanyActivityType
  ),
) => {
  const validation = companyActivitiesTypeSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      formErrors: validation.error.formErrors,
    } as const;
  }

  let companyActivitiesTypeId: string;
  try {
    companyActivitiesTypeId = await db.transaction(async trx => {
      //check if WebCard Template type exist

      let companyActivityTypesId;

      if (data.id) {
        await updateCompanyActivityType(
          data.id,
          {
            labelKey: validation.data.labelKey,
          },
          trx,
        );

        await createLabel(
          {
            labelKey: validation.data.labelKey,
            baseLabelValue: validation.data.baseLabelValue,
            translations: {},
          },
          trx,
        );

        companyActivityTypesId = data.id;
      } else {
        const id = await createCompanyActivitiesType(
          {
            labelKey: data.labelKey,
          },
          trx,
        );

        await createLabel(
          {
            labelKey: validation.data.labelKey,
            baseLabelValue: validation.data.baseLabelValue,
            translations: {},
          },
          trx,
        );

        companyActivityTypesId = id;
      }

      await saveLabelKey({
        labelKey: validation.data.labelKey,
        baseLabelValue: validation.data.baseLabelValue,
      });

      return companyActivityTypesId;
    });
  } catch (error) {
    throw new Error('Error while saving Company Activities Type');
  }

  revalidatePath(`/companyActivitiesTypes/[id]`);
  return { success: true, companyActivityId: companyActivitiesTypeId } as const;
};
