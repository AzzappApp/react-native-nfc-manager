'use server';
import { asc, eq } from 'drizzle-orm';
import {
  CardModuleTable,
  WebCardTable,
  checkMedias,
  createCardTemplate,
  createLabel,
  db,
  getCardTemplateById,
  referencesMedias,
  updateCardTemplate,
} from '@azzapp/data';
import { saveLabelKey } from '#helpers/lokaliseHelpers';
import {
  cardTemplateSchema,
  type CardTemplateFormValue,
} from './cardTemplateSchema';
import type { CardTemplateType } from '@azzapp/data';

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
    labelKey: validation.data.labelKey,
    cardStyleId: validation.data.cardStyle,
    modules: validation.data.modules,
    previewMediaId: validation.data.previewMediaId,
    businessEnabled: validation.data.businessEnabled,
    personalEnabled: validation.data.personalEnabled,
    cardTemplateTypeId: cardTemplateType ? cardTemplateType.id : null,
  };

  const label = {
    labelKey: validation.data.labelKey,
    baseLabelValue: validation.data.baseLabelValue,
    translations: {},
  };

  await checkMedias([validation.data.previewMediaId]);

  await db.transaction(async trx => {
    let previousMediaId: string | null = null;

    if (id) {
      const cardTemplate = await getCardTemplateById(id);
      previousMediaId = cardTemplate.previewMediaId;

      await db.transaction(async trx => {
        await updateCardTemplate(id, template, trx);
        await createLabel(label, trx);
        await saveLabelKey({
          labelKey: validation.data.labelKey,
          baseLabelValue: validation.data.baseLabelValue,
        });
      });
    } else {
      await db.transaction(async trx => {
        await createCardTemplate(template, trx);
        await createLabel(label, trx);
        await saveLabelKey({
          labelKey: validation.data.labelKey,
          baseLabelValue: validation.data.baseLabelValue,
        });
      });
    }
    await referencesMedias([template.previewMediaId], [previousMediaId], trx);
  });

  return {
    success: true,
    formErrors: null,
  } as const;
};
