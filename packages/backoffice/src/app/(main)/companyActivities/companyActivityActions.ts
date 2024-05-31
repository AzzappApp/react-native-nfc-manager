'use server';
import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  CardModuleTable,
  WebCardTable,
  createCompanyActivity,
  createLabel,
  db,
  updateCompanyActivity,
} from '@azzapp/data';
import { saveLabelKey } from '#helpers/lokaliseHelpers';
import { companyActivitySchema } from './companyActivitySchema';
import type { CompanyActivity, NewCompanyActivity } from '@azzapp/data';

export const getModulesData = async (profileUserName: string) => {
  const res = await db
    .select()
    .from(CardModuleTable)
    .innerJoin(WebCardTable, eq(WebCardTable.id, CardModuleTable.webCardId))
    .where(eq(WebCardTable.userName, profileUserName))
    .orderBy(asc(CardModuleTable.position));

  if (res.length < 1) return null;

  return res.map(({ CardModule }) => ({
    kind: CardModule.kind,
    data: CardModule.data,
  }));
};

export const saveCompanyActivity = async (
  data: {
    cardTemplateType?: { id: string };
    companyActivityType?: { id: string };
  } & (CompanyActivity | NewCompanyActivity),
) => {
  const validation = companyActivitySchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      formErrors: validation.error.formErrors,
    } as const;
  }

  console.log({ data });

  let companyActivityId: string;
  try {
    companyActivityId = await db.transaction(async trx => {
      //check if WebCard Template type exist

      let companyActivityId;

      if (data.id) {
        await updateCompanyActivity(
          data.id,
          {
            labelKey: validation.data.labelKey,
            cardTemplateTypeId: data.cardTemplateType?.id ?? null,
            companyActivityTypeId: data.companyActivityType?.id ?? null,
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

        companyActivityId = data.id;
      } else {
        const id = await createCompanyActivity(
          {
            labelKey: data.labelKey,
            cardTemplateTypeId: data.cardTemplateType?.id ?? null,
            companyActivityTypeId: data.companyActivityType?.id ?? null,
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

        companyActivityId = id;
      }

      await saveLabelKey({
        labelKey: validation.data.labelKey,
        baseLabelValue: validation.data.baseLabelValue,
      });

      return companyActivityId;
    });
  } catch (error) {
    throw new Error('Error while saving Company Activity');
  }

  revalidatePath(`/companyActivities/[id]`);
  return { success: true, companyActivityId } as const;
};
