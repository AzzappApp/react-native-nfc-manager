'use server';
import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  CardModuleTable,
  WebCardTable,
  createCompanyActivity,
  db,
  saveLocalizationMessage,
  updateCompanyActivity,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import { companyActivitySchema } from './companyActivitySchema';

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
    companyActivityId = await db.transaction(async trx => {
      //check if WebCard Template type exist

      let companyActivityId;

      if (data.id) {
        await updateCompanyActivity(
          data.id,
          {
            cardTemplateTypeId: data.cardTemplateTypeId ?? null,
            companyActivityTypeId: data.companyActivityTypeId ?? null,
          },
          trx,
        );

        await saveLocalizationMessage(
          {
            key: data.id,
            value: validation.data.label,
            locale: DEFAULT_LOCALE,
            target: ENTITY_TARGET,
          },
          trx,
        );

        companyActivityId = data.id;
      } else {
        const id = await createCompanyActivity(
          {
            cardTemplateTypeId: data.cardTemplateTypeId ?? null,
            companyActivityTypeId: data.companyActivityTypeId ?? null,
          },
          trx,
        );

        await saveLocalizationMessage(
          {
            key: id,
            value: validation.data.label,
            locale: DEFAULT_LOCALE,
            target: ENTITY_TARGET,
          },
          trx,
        );

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
