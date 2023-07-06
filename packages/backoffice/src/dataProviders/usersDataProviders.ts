import { eq } from 'drizzle-orm';
import { db, UserTable } from '@azzapp/data/domains';
import { getList, getMany, getOne } from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { User } from '@azzapp/data/domains';

const UserDataProviders: ResourceDataProvider<Omit<User, 'password'>> = {
  getList: params =>
    getList('User', params).then(({ data, total }) => ({
      data: data.map(({ password: _, ...rest }) => rest),
      total,
    })),
  getOne: params =>
    getOne('User', params as any).then(
      ({ data: { password: _, ...data } }) => ({
        data,
      }),
    ),
  getMany: params =>
    getMany('User', params).then(({ data }) => ({
      data: data.map(record => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = record;
        return rest;
      }),
    })),
  update: async params => {
    const {
      id,
      data: { roles },
    } = params;
    await db
      .update(UserTable)
      .set({ roles })
      .where(eq(UserTable.id, id as string));
    return UserDataProviders.getOne({ id: id as string });
  },
};

export default UserDataProviders;
