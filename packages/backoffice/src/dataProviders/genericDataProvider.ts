import { createId } from '@paralleldrive/cuid2';
import { sql, eq, inArray } from 'drizzle-orm';
import {
  CompanyActivityTable,
  InterestTable,
  ProfileCategoryTable,
  StaticMediaTable,
  UserTable,
  CoverTemplateTable,
  db,
} from '@azzapp/data/domains';
import type { Resources } from './resourceDataProviders';
import type {
  CoverTemplate,
  ProfileCategory,
  User,
  Interest,
  StaticMedia,
  CompanyActivity,
} from '@azzapp/data/domains';
import type {
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
  CreateParams,
  CreateResult,
} from 'react-admin';

type ResourcesToTypes<T extends Resources> = T extends 'StaticMedia'
  ? StaticMedia
  : T extends 'CoverTemplate'
  ? CoverTemplate
  : T extends 'ProfileCategory'
  ? ProfileCategory
  : T extends 'User'
  ? User
  : T extends 'Interest'
  ? Interest
  : T extends 'CompanyActivity'
  ? CompanyActivity
  : never;

const getResource = <T extends Resources>(resource: T) => {
  switch (resource) {
    case 'StaticMedia':
      return StaticMediaTable;
    case 'CoverTemplate':
      return CoverTemplateTable;
    case 'ProfileCategory':
      return ProfileCategoryTable;
    case 'User':
      return UserTable;
    case 'Interest':
      return InterestTable;
    case 'CompanyActivity':
      return CompanyActivityTable;
    default:
      throw new Error(`Unknown resource ${resource}`);
  }
};

export const getList = async <TType extends Resources>(
  resource: TType,
  params: GetListParams,
): Promise<GetListResult<ResourcesToTypes<TType>>> => {
  const dbResource = getResource(resource);

  let query = db.select().from(dbResource);
  let countQuery = db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(dbResource);

  if (params.filter) {
    Object.entries(params.filter).forEach(([key, value]) => {
      query = query.where(sql.raw(`${key} like "${value}%"`));
      countQuery = countQuery.where(sql.raw(`${key} like "${value}%"`));
    });
  }
  if (params.sort) {
    query = query.orderBy(
      sql.raw(`${params.sort.field} ${params.sort.order.toLowerCase()}`),
    );
  }
  if (params.pagination) {
    query = query
      .limit(params.pagination.perPage)
      .offset((params.pagination.page - 1) * params.pagination.perPage);
  }

  const data = await query.execute();
  const count = await countQuery.execute().then(res => res[0].count);
  return {
    data: data as any,
    total: count,
  };
};

export const getOne = async <TResource extends Resources>(
  resource: TResource,
  params: GetOneParams<ResourcesToTypes<TResource>>,
): Promise<GetOneResult<ResourcesToTypes<TResource>>> =>
  db
    .select()
    .from(getResource(resource))
    .where(eq(getResource(resource).id, params.id))
    .execute()
    .then(res => {
      const result = res.pop();
      if (!result) throw new Error('Not found');
      return { data: result as ResourcesToTypes<TResource> };
    });

export const getMany = async <TResource extends Resources>(
  resource: TResource,
  params: GetManyParams,
): Promise<GetManyResult<ResourcesToTypes<TResource>>> => {
  const records = await db
    .select()
    .from(getResource(resource))
    .where(inArray(getResource(resource).id, params.ids as string[]))
    .execute();

  const map = new Map(records.map((record: any) => [record.id, record]));

  const data = params.ids.map(id => map.get(id)).filter(Boolean);

  return { data } as any;
};

export const update = async <TResource extends Resources>(
  resource: TResource,
  params: UpdateParams<ResourcesToTypes<TResource>>,
): Promise<UpdateResult<ResourcesToTypes<TResource>>> => {
  const { id, ...data } = params.data;
  await db
    .update(getResource(resource))
    .set(data)
    .where(eq(getResource(resource).id, id as string))
    .execute();

  return getOne(resource, params as any) as any;
};

export const updateMany = async <TResource extends Resources>(
  resource: TResource,
  params: UpdateManyParams<ResourcesToTypes<TResource>>,
): Promise<UpdateManyResult<ResourcesToTypes<TResource>>> => {
  await db
    .update(getResource(resource))
    .set(params.data)
    .where(inArray(getResource(resource).id, params.ids as string[]))
    .execute();

  return { data: params.ids as string[] };
};

export const create = async <TResource extends Resources>(
  resource: TResource,
  params: CreateParams<ResourcesToTypes<TResource>>,
): Promise<CreateResult<ResourcesToTypes<TResource>>> => {
  const id = params.data.id ?? createId();
  await db
    .insert(getResource(resource))
    .values({ ...params.data, id })
    .execute();

  return getOne(resource, { id });
};
