'use server';
import { revalidatePath } from 'next/cache';
import {
  createCardTemplate,
  getCardModulesByWebCard,
  getCardTemplateById,
  getWebCardByUserName,
  referencesMedias,
  saveLocalizationMessage,
  transaction,
  updateCardTemplate,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import {
  cardTemplateSchema,
  type CardTemplateFormValue,
} from './cardTemplateSchema';
import type { CardTemplateType } from '@azzapp/data';

export const getModulesData = async (profileUserName: string) => {
  const webCard = await getWebCardByUserName(profileUserName);
  if (!webCard) {
    return null;
  }
  const modules = await getCardModulesByWebCard(webCard.id);
  if (modules.length === 0) {
    return null;
  }
  return modules.map(({ data, variant, kind }) => ({ kind, variant, data }));
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

    await transaction(async () => {
      let previousMediaId: string | null = null;
      if (id) {
        const cardTemplate = await getCardTemplateById(id);
        if (!cardTemplate) {
          throw new Error('Card template not found');
        }
        previousMediaId = cardTemplate.previewMediaId;

        await updateCardTemplate(id, template);
        await saveLocalizationMessage({
          key: id,
          value: validation.data.label,
          locale: DEFAULT_LOCALE,
        });
      } else {
        const id = await createCardTemplate(template);
        await saveLocalizationMessage({
          key: id,
          value: validation.data.label,
          locale: DEFAULT_LOCALE,
        });
      }
      await referencesMedias([template.previewMediaId], [previousMediaId]);
    });

    revalidatePath(`/cardTemplates/[id]`);

    return {
      success: true,
      formErrors: null,
    } as const;
  } catch (e) {
    console.error(e);

    throw e;
  }
};
