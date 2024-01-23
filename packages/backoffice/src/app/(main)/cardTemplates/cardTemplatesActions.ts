'use server';
import { asc, eq } from 'drizzle-orm';
import {
  CardModuleTable,
  ProfileTable,
  WebCardTable,
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
import type { CardTemplateType } from '@azzapp/data/domains';

export const getModulesData = async (profileUserName: string) => {
  const res = await db
    .select()
    .from(CardModuleTable)
    .innerJoin(WebCardTable, eq(ProfileTable.id, CardModuleTable.webCardId))
    .where(eq(WebCardTable.userName, profileUserName))
    .orderBy(asc(CardModuleTable.position));

  if (res.length < 1) return null;

  return res.map(({ CardModule }) => ({
    kind: CardModule.kind,
    data: CardModule.data,
  }));
};

export const saveCardTemplate = async (
  data: Partial<
    CardTemplateFormValue & { cardTemplateType?: CardTemplateType }
  >,
  id?: string,
) => {
  const { cardTemplateType, ...cardTemplateData } = data;
  const validation = cardTemplateSchema.safeParse(cardTemplateData);
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
    cardTemplateTypeId: cardTemplateType ? cardTemplateType.id : null,
  };

  await checkMedias([validation.data.previewMediaId]);

  await db.transaction(async trx => {
    let previousMediaId: string | null = null;

    if (id) {
      const cardTemplate = await getCardTemplateById(id);
      previousMediaId = cardTemplate.previewMediaId;
      await updateCardTemplate(id, template);
    } else {
      await createCardTemplate(template);
    }
    await referencesMedias([template.previewMediaId], [previousMediaId], trx);
  });

  return {
    success: true,
    formErrors: null,
  } as const;
};
