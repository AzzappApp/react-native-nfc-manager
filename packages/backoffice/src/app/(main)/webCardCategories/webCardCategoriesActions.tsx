'use server';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  WebCardCategoryTable,
  CompanyActivityTable,
  WebCardCategoryCompanyActivityTable,
  getWebCardCategoryById,
  db,
  referencesMedias,
  checkMedias,
  LocalizationMessageTable,
  saveLocalizationMessage,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
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
    webCardCategoryId = await db.transaction(async trx => {
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
          throw new Error('Profile category not found');
        }
        previousMedias = oldCategory.medias;

        webCardCategoryId = id;
        await trx
          .update(WebCardCategoryTable)
          .set({
            ...webCardCategoryData,
            cardTemplateTypeId: data.cardTemplateType?.id ?? null,
          })
          .where(eq(WebCardCategoryTable.id, id));
      } else {
        webCardCategoryId = createId();
        await trx.insert(WebCardCategoryTable).values({
          ...webCardCategoryData,
          cardTemplateTypeId: data.cardTemplateType?.id ?? null,
          id: webCardCategoryId,
        });
      }

      await saveLocalizationMessage(
        {
          key: webCardCategoryId,
          value: label,
          locale: DEFAULT_LOCALE,
          target: ENTITY_TARGET,
        },
        trx,
      );
      await referencesMedias(webCardCategoryData.medias, previousMedias, trx);

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
        await trx
          .delete(WebCardCategoryCompanyActivityTable)
          .where(
            and(
              eq(
                WebCardCategoryCompanyActivityTable.webCardCategoryId,
                webCardCategoryId,
              ),
            ),
          );

        if (activitiesToCreate.length) {
          await trx.insert(CompanyActivityTable).values(activitiesToCreate);
          const labels = activitiesToCreate.map(activity => ({
            key: activity.id,
            value: activity.label,
            locale: DEFAULT_LOCALE,
            target: ENTITY_TARGET,
          }));
          await trx.insert(LocalizationMessageTable).values(labels);
        }
        if (categoriesToAssociate.length > 0) {
          await trx.insert(WebCardCategoryCompanyActivityTable).values(
            categoriesToAssociate.map((activityId, index) => ({
              webCardCategoryId,
              companyActivityId: activityId,
              order: index,
            })),
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
