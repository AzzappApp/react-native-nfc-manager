import { createId } from '@paralleldrive/cuid2';
import { db } from '@azzapp/data/domains';
import { sqlCountToNumber } from '@azzapp/data/domains/generic';
import type { Resources } from './resourceDataProviders';
import type {
  CoverTemplate,
  ProfileCategory,
  User,
  Interest,
  StaticMedia,
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
  : never;

export const getList = async <TType extends Resources>(
  resource: TType,
  params: GetListParams,
): Promise<GetListResult<ResourcesToTypes<TType>>> => {
  let query = db.selectFrom(resource).selectAll();
  let countQuery = db
    .selectFrom(resource)
    .select(db.fn.count('id').as('count'));

  if (params.filter) {
    Object.entries(params.filter).forEach(([key, value]) => {
      query = query.where(key as any, 'like', `${value}%`);
      countQuery = countQuery.where(key as any, 'like', `${value}%`);
    });
  }
  if (params.sort) {
    query = query.orderBy(
      params.sort.field as any,
      params.sort.order.toLowerCase() as any,
    );
  }
  if (params.pagination) {
    query = query
      .limit(params.pagination.perPage)
      .offset((params.pagination.page - 1) * params.pagination.perPage);
  }

  const data = await query.execute();
  const count = await countQuery
    .executeTakeFirstOrThrow()
    .then(({ count }) => sqlCountToNumber(count));
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
    .selectFrom(resource)
    .selectAll()
    .where('id', '=', params.id as any)
    .executeTakeFirstOrThrow()
    .then(data => ({ data } as any));

export const getMany = async <TResource extends Resources>(
  resource: TResource,
  params: GetManyParams,
): Promise<GetManyResult<ResourcesToTypes<TResource>>> => {
  const records = await db
    .selectFrom(resource)
    .selectAll()
    .where('id', 'in', params.ids as any)
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
    .updateTable(resource)
    .set(data as any)
    .where('id', '=', id as any)
    .execute();

  return getOne(resource, params as any) as any;
};

export const updateMany = async <TResource extends Resources>(
  resource: TResource,
  params: UpdateManyParams<ResourcesToTypes<TResource>>,
): Promise<UpdateManyResult<ResourcesToTypes<TResource>>> => {
  await db
    .updateTable(resource)
    .set(params.data as any)
    .where('id', 'in', params.ids as any)
    .execute();

  return params.ids as any;
};

export const create = async <TResource extends Resources>(
  resource: TResource,
  params: CreateParams<ResourcesToTypes<TResource>>,
): Promise<CreateResult<ResourcesToTypes<TResource>>> => {
  const id = params.data.id ?? createId();
  await db
    .insertInto(resource)
    .values({ ...params.data, id } as any)
    .executeTakeFirstOrThrow();

  return getOne(resource, { id }) as any;
};
