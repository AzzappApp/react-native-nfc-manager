'use server';

import { eq } from 'drizzle-orm';
import {
  CardModuleTable,
  CardTemplateCompanyActivityTable,
  CardTemplateProfileCategoryTable,
  ProfileTable,
  createCardTemplate,
  db,
  updateCardTemplate,
} from '@azzapp/data/domains';
import {
  coverTemplateSchema,
  type CardTemplateFormValue,
} from './cardTemplateSchema';

export const getModulesData = async (profileUserName: string) => {
  const res = await db
    .select()
    .from(CardModuleTable)
    .innerJoin(ProfileTable, eq(ProfileTable.id, CardModuleTable.profileId))
    .where(eq(ProfileTable.userName, profileUserName));

  if (res.length < 1) return null;

  return res.map(({ CardModule }) => ({
    kind: CardModule.kind,
    data: CardModule.data,
  }));
};

export const saveCardTemplate = async (
  data: Partial<CardTemplateFormValue>,
  id?: string,
) => {
  const validation = coverTemplateSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      formErrors: validation.error.formErrors,
    } as const;
  }

  const template = {
    labels: validation.data.labels,
    cardStyleId: validation.data.cardStyle,
    modules: validation.data.modules,
    businessEnabled: validation.data.businessEnabled,
    personalEnabled: validation.data.personalEnabled,
  };

  await db.transaction(async trx => {
    let cardTemplateId: string;
    if (id) {
      await trx
        .delete(CardTemplateCompanyActivityTable)
        .where(eq(CardTemplateCompanyActivityTable.cardTemplateId, id));

      await trx
        .delete(CardTemplateProfileCategoryTable)
        .where(eq(CardTemplateProfileCategoryTable.cardTemplateId, id));
    }
    if (id) {
      cardTemplateId = id;
      await updateCardTemplate(id, template);
    } else {
      const cardTemplate = await createCardTemplate(template);
      cardTemplateId = cardTemplate.id;
    }
    if (validation.data.companyActivities?.length) {
      await trx.insert(CardTemplateCompanyActivityTable).values(
        validation.data.companyActivities.map(companyActivityId => ({
          cardTemplateId,
          companyActivityId,
        })),
      );
    }
    if (validation.data.profileCategories?.length) {
      await trx.insert(CardTemplateProfileCategoryTable).values(
        validation.data.profileCategories.map(profileCategoryId => ({
          cardTemplateId,
          profileCategoryId,
        })),
      );
    }
  });

  return {
    success: true,
    formErrors: null,
  } as const;
};
