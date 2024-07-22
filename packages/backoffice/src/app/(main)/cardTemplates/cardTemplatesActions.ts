'use server';
import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  CardModuleTable,
  WebCardTable,
  checkMedias,
  createCardTemplate,
  db,
  getCardTemplateById,
  referencesMedias,
  saveLocalizationMessage,
  updateCardTemplate,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
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
    cardStyleId: validation.data.cardStyle,
    modules: validation.data.modules,
    previewMediaId: validation.data.previewMediaId,
    businessEnabled: validation.data.businessEnabled,
    personalEnabled: validation.data.personalEnabled,
    cardTemplateTypeId: cardTemplateType ? cardTemplateType.id : null,
  };

  try {
    await checkMedias([validation.data.previewMediaId]);

    await db.transaction(async trx => {
      let previousMediaId: string | null = null;

      if (id) {
        const cardTemplate = await getCardTemplateById(id);
        previousMediaId = cardTemplate.previewMediaId;

        await db.transaction(async trx => {
          await updateCardTemplate(id, template, trx);
          await saveLocalizationMessage(
            {
              key: id,
              value: validation.data.label,
              locale: DEFAULT_LOCALE,
              target: ENTITY_TARGET,
            },
            trx,
          );
        });
      } else {
        await db.transaction(async trx => {
          const id = await createCardTemplate(template, trx);
          await saveLocalizationMessage(
            {
              key: id,
              value: validation.data.label,
              locale: DEFAULT_LOCALE,
              target: ENTITY_TARGET,
            },
            trx,
          );
        });
      }
      await referencesMedias([template.previewMediaId], [previousMediaId], trx);
    });

    revalidatePath(`/cardTemplates/[id]`);

    return {
      success: true,
      formErrors: null,
    } as const;
  } catch (e) {
    console.log(e);

    throw e;
  }
};
