'use server';
import { createId } from '@paralleldrive/cuid2';
import { revalidatePath } from 'next/cache';
import {
  getWebCardCategoryById,
  referencesMedias,
  checkMedias,
  saveLocalizationMessage,
  transaction,
  updateWebCardCategory,
  createWebCardCategory,
  removeAllWebCardCategoryCompanyActivities,
  createCompanyActivities,
  createLocalizationMessages,
  createWebCardCategoryCompanyActivities,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { webCardCategorySchema } from './webCardCategorySchema';
import type {
  NewWebCardCategory,
  WebCardCategory,
  CompanyActivity,
} from '@azzapp/data';

export const saveWebCardCategory = async (
  data: {
    label: string;
    cardTemplateType?: { id: string };
  } & { activities?: Array<string | { id: string }> } & (
      | NewWebCardCategory
      | WebCardCategory
    ),
): Promise<{
  success: boolean;
  formErrors?: any;
  message?: string;
  webCardCategoryId?: string;
}> => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = webCardCategorySchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }
  let previousMedias: string[] = [];

  let webCardCategoryId: string;

  await checkMedias(data.medias);

  try {
    webCardCategoryId = await transaction(async () => {
      const {
        id,
        activities,
        cardTemplateType,
        label,
        ...webCardCategoryData
      } = data;

      let webCardCategoryId: string;
      if (id) {
        const oldCategory = await getWebCardCategoryById(id);
        if (!oldCategory) {
          throw new Error('Web Card category not found');
        }
        previousMedias = oldCategory.medias;

        webCardCategoryId = id;
        await updateWebCardCategory(id, {
          ...webCardCategoryData,
          cardTemplateTypeId: data.cardTemplateType?.id ?? null,
        });
      } else {
        webCardCategoryId = await createWebCardCategory({
          ...webCardCategoryData,
          cardTemplateTypeId: data.cardTemplateType?.id ?? null,
        });
      }

      await saveLocalizationMessage({
        key: webCardCategoryId,
        value: label,
        locale: DEFAULT_LOCALE,
      });
      await referencesMedias(webCardCategoryData.medias, previousMedias);

      if (activities?.length) {
        const activitiesToCreate: Array<CompanyActivity & { label: string }> =
          [];
        const categoriesToAssociate: string[] = [];
        activities.forEach(async activity => {
          if (typeof activity === 'string') {
            const id = createId();
            activitiesToCreate.push({
              id,
              label: activity,
              cardTemplateTypeId: data.cardTemplateType?.id ?? null,
              companyActivityTypeId: null,
            });
            categoriesToAssociate.push(id);
          } else {
            categoriesToAssociate.push(activity.id);
          }
        });

        //delete all activities associated to the category
        await removeAllWebCardCategoryCompanyActivities(webCardCategoryId);

        if (activitiesToCreate.length) {
          await createCompanyActivities(activitiesToCreate);
          const labels = activitiesToCreate.map(activity => ({
            key: activity.id,
            value: activity.label,
            locale: DEFAULT_LOCALE,
          }));
          await createLocalizationMessages(labels);
        }
        if (categoriesToAssociate.length > 0) {
          await createWebCardCategoryCompanyActivities(
            webCardCategoryId,
            categoriesToAssociate,
          );
        }
      }
      return webCardCategoryId;
    });
    revalidatePath(`/webCardCategories/[id]`);
    return { success: true, webCardCategoryId } as const;
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Error while saving profile category',
    };
  }
};
