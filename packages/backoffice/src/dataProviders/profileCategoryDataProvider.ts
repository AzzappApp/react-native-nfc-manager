import { createId } from '@paralleldrive/cuid2';
import { createMedia, db } from '@azzapp/data/domains';
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
          .selectFrom('CompanyActivity')
          .selectAll()
          .where('profileCategoryId', '=', category.id)
          .orderBy('order', 'asc')
          .execute(),
      },
    };
  },
  getMany: params => getMany('ProfileCategory', params),
  update: async params => {
    const data = params.data;
    const id = params.id as string;
    await db.transaction().execute(async trx => {
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
            ({ id: categoryId, labels }: any, index: number) => {
              if (categoryId) {
                return trx
                  .updateTable('CompanyActivity')
                  .set({
                    labels: JSON.stringify(labels),
                    order: index,
                  })
                  .where('id', '=', categoryId)
                  .execute();
              } else {
                return trx
                  .insertInto('CompanyActivity')
                  .values({
                    id: createId(),
                    profileCategoryId: id,
                    labels: JSON.stringify(labels),
                    order: index,
                  })
                  .execute();
              }
            },
          ),
        );
      }

      return trx
        .updateTable('ProfileCategory')
        .set({
          available: data.available,
          profileKind: data.profileKind,
          labels: JSON.stringify(params.data.labels),
          medias: JSON.stringify(medias.map(({ id }) => id)),
          order: data.order,
        })
        .where('id', '=', params.id as any)
        .executeTakeFirstOrThrow();
    });
    return ProfileCategoryDataProviders.getOne({ id });
  },
  create: async params => {
    const { id: maybeId, ...data } = params.data;
    const id = maybeId ?? createId();
    await db.transaction().execute(async trx => {
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
              .insertInto('CompanyActivity')
              .values({
                id: createId(),
                profileCategoryId: id,
                labels: JSON.stringify(labels),
                order: index,
              })
              .execute(),
          ),
        );
      }

      return trx
        .insertInto('ProfileCategory')
        .values({
          id,
          available: params.data.available,
          profileKind: params.data.profileKind,
          labels: JSON.stringify(params.data.labels),
          medias: JSON.stringify(medias.map(({ id }) => id)),
          order: params.data.order,
        })
        .executeTakeFirstOrThrow();
    });
    return ProfileCategoryDataProviders.getOne({ id });
  },
};

export default ProfileCategoryDataProviders;
