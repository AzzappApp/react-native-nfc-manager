import { createId } from '@paralleldrive/cuid2';
import { eq, asc } from 'drizzle-orm';
import {
  CompanyActivityTable,
  createMedia,
  db,
  ProfileCategoryTable,
} from '@azzapp/data/domains';
import { getList, getMany, getOne } from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { CompanyActivity, ProfileCategory } from '@azzapp/data/domains';

export type ProfileCategoryWithActivities = ProfileCategory & {
  activities: CompanyActivity[];
};

const ProfileCategoryDataProviders: ResourceDataProvider<
  ProfileCategory,
  ProfileCategoryWithActivities
> = {
  getList: params => getList('ProfileCategory', params),
  getOne: async params => {
    const { data: category } = await getOne('ProfileCategory', params);
    return {
      data: {
        ...category,
        activities: await db
          .select()
          .from(CompanyActivityTable)

          .where(eq(CompanyActivityTable.profileCategoryId, category.id))
          .orderBy(asc(CompanyActivityTable.order))
          .execute(),
      },
    };
  },
  getMany: params => getMany('ProfileCategory', params),
  update: async params => {
    const data = params.data;
    const id = params.id as string;
    await db.transaction(async trx => {
      const medias = await Promise.all(
        (data.medias as string[]).map(
          (media: string | { id: string; width: number; height: number }) => {
            if (typeof media === 'string') {
              return { id: media };
            }
            return createMedia(
              {
                id: media.id,
                kind: 'image',
                width: media.width,
                height: media.height,
              },
              trx,
            );
          },
        ),
      );

      if (data.activities) {
        await Promise.all(
          data.activities.map(
            ({ id: activityId, labels }: any, index: number) => {
              if (activityId) {
                return trx
                  .update(CompanyActivityTable)
                  .set({
                    labels,
                    order: index,
                  })
                  .where(eq(CompanyActivityTable.id, activityId))
                  .execute();
              } else {
                return trx
                  .insert(CompanyActivityTable)
                  .values({
                    id: createId(),
                    profileCategoryId: id,
                    labels,
                    order: index,
                  })
                  .execute();
              }
            },
          ),
        );
      }

      return trx
        .update(ProfileCategoryTable)
        .set({
          available: data.available,
          profileKind: data.profileKind,
          labels: params.data.labels,
          medias: medias.map(({ id }) => id),
          order: data.order,
        })
        .where(eq(ProfileCategoryTable.id, params.id as string))
        .execute();
    });
    return ProfileCategoryDataProviders.getOne({ id });
  },
  create: async params => {
    const { id: maybeId, ...data } = params.data;
    const id = maybeId ?? createId();
    await db.transaction(async trx => {
      const medias = await Promise.all(
        (data.medias as any[]).map(
          (media: { id: string; width: number; height: number }) =>
            createMedia(
              {
                id: media.id,
                kind: 'image',
                width: media.width,
                height: media.height,
              },
              trx,
            ),
        ),
      );

      if (data.activities) {
        await Promise.all(
          data.activities.map(({ labels }: any, index: number) =>
            trx
              .insert(CompanyActivityTable)
              .values({
                id: createId(),
                profileCategoryId: id,
                labels,
                order: index,
              })
              .execute(),
          ),
        );
      }

      return trx
        .insert(ProfileCategoryTable)
        .values({
          id,
          available: params.data.available,
          profileKind: params.data.profileKind,
          labels: params.data.labels,
          medias: medias.map(({ id }) => id),
          order: params.data.order,
        })
        .execute();
    });
    return ProfileCategoryDataProviders.getOne({ id });
  },
};

export default ProfileCategoryDataProviders;
