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
  createLabel,
  LabelTable,
} from '@azzapp/data';
import { ADMIN } from '#roles';
import { saveLabelKey } from '#helpers/lokaliseHelpers';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { webCardCategorySchema } from './webCardCategorySchema';
import type {
  NewWebCardCategory,
  WebCardCategory,
  CompanyActivity,
  Label,
} from '@azzapp/data';

export const saveWebCardCategory = async (
  data: Label & {
    cardTemplateType?: { id: string };
  } & { activities?: Array<string | { id: string }> } & (
      | NewWebCardCategory
      | WebCardCategory
    ),
) => {
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
        baseLabelValue,
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

        await createLabel(
          {
            labelKey: data.labelKey,
            baseLabelValue: data.baseLabelValue,
            translations: {},
          },
          trx,
        );
      } else {
        webCardCategoryId = createId();
        await trx.insert(WebCardCategoryTable).values({
          ...webCardCategoryData,
          cardTemplateTypeId: data.cardTemplateType?.id ?? null,
          id: webCardCategoryId,
        });

        await createLabel(
          {
            labelKey: data.labelKey,
            baseLabelValue: data.baseLabelValue,
            translations: {},
          },
          trx,
        );
      }

      await saveLabelKey({
        labelKey: data.labelKey,
        baseLabelValue: data.baseLabelValue,
      });

      await referencesMedias(webCardCategoryData.medias, previousMedias, trx);

      if (activities?.length) {
        const activitiesToCreate: CompanyActivity[] = [];
        const categoriesToAssociate: string[] = [];
        activities.forEach(async activity => {
          if (typeof activity === 'string') {
            const id = createId();
            activitiesToCreate.push({
              id,
              labelKey: activity,
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
            labelKey: activity.labelKey,
            baseLabelValue: activity.labelKey,
            translations: {},
          }));
          await trx.insert(LabelTable).values(labels);

          await saveLabelKey(
            labels.map(label => ({
              labelKey: label.labelKey,
              baseLabelValue: label.baseLabelValue,
            })),
          );
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
  } catch (e) {
    throw new Error('Error while saving profile category');
  }

  revalidatePath(`/webCardCategories/[id]`);
  return { success: true, webCardCategoryId } as const;
};
