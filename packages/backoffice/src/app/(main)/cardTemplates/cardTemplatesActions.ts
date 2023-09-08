'use server';

import { asc, eq } from 'drizzle-orm';
import {
  CardModuleTable,
  CardTemplateCompanyActivityTable,
  CardTemplateProfileCategoryTable,
  ProfileTable,
  checkMedias,
  createCardTemplate,
  db,
  getCardTemplateById,
  referencesMedias,
  updateCardTemplate,
} from '@azzapp/data/domains';
import {
  cardTemplateSchema,
  type CardTemplateFormValue,
} from './cardTemplateSchema';

export const getModulesData = async (profileUserName: string) => {
  const res = await db
    .select()
    .from(CardModuleTable)
    .innerJoin(ProfileTable, eq(ProfileTable.id, CardModuleTable.profileId))
    .where(eq(ProfileTable.userName, profileUserName))
    .orderBy(asc(CardModuleTable.position));

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
  const validation = cardTemplateSchema.safeParse(data);

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
    previewMediaId: validation.data.previewMediaId,
    businessEnabled: validation.data.businessEnabled,
    personalEnabled: validation.data.personalEnabled,
  };

  await checkMedias([validation.data.previewMediaId]);

  await db.transaction(async trx => {
    let cardTemplateId: string;
    let previousMediaId: string | null = null;

    if (id) {
      const cardTemplate = await getCardTemplateById(id);

      await trx
        .delete(CardTemplateCompanyActivityTable)
        .where(eq(CardTemplateCompanyActivityTable.cardTemplateId, id));

      await trx
        .delete(CardTemplateProfileCategoryTable)
        .where(eq(CardTemplateProfileCategoryTable.cardTemplateId, id));
      cardTemplateId = id;
      previousMediaId = cardTemplate.previewMediaId;

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
    await referencesMedias([template.previewMediaId], [previousMediaId], trx);
  });

  return {
    success: true,
    formErrors: null,
  } as const;
};
