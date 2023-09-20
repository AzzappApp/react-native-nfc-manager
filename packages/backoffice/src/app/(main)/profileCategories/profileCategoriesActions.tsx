'use server';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  ProfileCategoryTable,
  CompanyActivityTable,
  ProfileCategoryCompanyActivityTable,
  getProfileCategoryById,
  db,
  referencesMedias,
  checkMedias,
} from '@azzapp/data/domains';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { profileCategorySchema } from './profileCategorySchema';
import type {
  NewProfileCategory,
  ProfileCategory,
  CompanyActivity,
} from '@azzapp/data/domains';

export const saveProfileCategory = async (
  data: { activities?: Array<string | { id: string }> } & (
    | NewProfileCategory
    | ProfileCategory
  ),
) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = profileCategorySchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }
  let previousMedias: string[] = [];

  let profileCategoryId: string;

  await checkMedias(data.medias);

  try {
    profileCategoryId = await db.transaction(async trx => {
      const { id, activities, ...profileCategoryData } = data;
      let profileCategoryId: string;
      if (id) {
        const oldCategory = await getProfileCategoryById(id);
        if (!oldCategory) {
          throw new Error('Profile category not found');
        }
        previousMedias = oldCategory.medias;

        profileCategoryId = id;
        await trx
          .update(ProfileCategoryTable)
          .set(profileCategoryData)
          .where(eq(ProfileCategoryTable.id, id));
      } else {
        profileCategoryId = createId();
        await trx
          .insert(ProfileCategoryTable)
          .values({ ...profileCategoryData, id: profileCategoryId });
      }

      await referencesMedias(profileCategoryData.medias, previousMedias, trx);

      if (activities?.length) {
        const activitiesToCreate: CompanyActivity[] = [];
        const categoriesToAssociate: string[] = [];
        activities.forEach(async activity => {
          if (typeof activity === 'string') {
            const id = createId();
            activitiesToCreate.push({
              id,
              labels: { en: activity },
            });
            categoriesToAssociate.push(id);
          } else {
            categoriesToAssociate.push(activity.id);
          }
        });

        //delete all activities associated to the category
        await trx
          .delete(ProfileCategoryCompanyActivityTable)
          .where(
            and(
              eq(
                ProfileCategoryCompanyActivityTable.profileCategoryId,
                profileCategoryId,
              ),
            ),
          );

        if (activitiesToCreate.length) {
          await trx.insert(CompanyActivityTable).values(activitiesToCreate);
        }
        if (categoriesToAssociate.length > 0) {
          await trx.insert(ProfileCategoryCompanyActivityTable).values(
            categoriesToAssociate.map((activityId, index) => ({
              profileCategoryId,
              companyActivityId: activityId,
              order: index,
            })),
          );
        }
      }
      return profileCategoryId;
    });
  } catch (e) {
    throw new Error('Error while saving profile category');
  }

  revalidatePath(`/profileCategories/[id]`);
  return { success: true, profileCategoryId } as const;
};
