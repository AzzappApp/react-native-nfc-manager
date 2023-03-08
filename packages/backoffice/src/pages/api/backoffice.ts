import { createId } from '@paralleldrive/cuid2';
import { verifyToken } from '@azzapp/auth/tokens';
import { db, getUsersByIds } from '@azzapp/data/domains';
import { sqlCountToNumber } from '@azzapp/data/domains/generic';
import ERRORS from '@azzapp/shared/errors';
import type { NextApiHandler } from 'next';
import type {
  DataProvider,
  GetListResult,
  GetManyResult,
  GetOneResult,
} from 'react-admin';

const handler: NextApiHandler = async (req, res) => {
  const { method } = req;
  if (method !== 'POST') {
    return res.status(405).end(`Method ${method} Not Allowed`);
  }
  const token = req.headers['authorization']?.split(' ')?.[1] ?? null;
  if (!token) {
    res.status(401).json({ message: ERRORS.UNAUTORIZED });
    return;
  }
  let userId: string;
  try {
    ({ userId } = await verifyToken(token));
  } catch (e) {
    res.status(401).json({ message: ERRORS.INVALID_TOKEN });
    return;
  }
  const [user] = await getUsersByIds([userId]);
  if (!user) {
    res.status(401).json({ message: ERRORS.UNAUTORIZED });
    return;
  }
  const roles = user.roles as string[] | null;
  if (!roles?.includes('admin')) {
    res.status(403).json({ message: ERRORS.FORBIDDEN });
  }

  try {
    const { command, resource, params } = req.body;
    if (!dataProvider[command]) {
      res.status(400).json({ message: ERRORS.INVALID_REQUEST });
      return;
    }
    const result = await dataProvider[command]?.(resource, params);
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Not supported yet') {
        res.status(501).json({ message: ERRORS.INVALID_REQUEST });
        return;
      }
    }

    console.error(e);
    res.status(500).json({ message: ERRORS.INTERNAL_SERVER_ERROR });
  }
};

export default handler;

type ResourceType =
  | 'Card'
  | 'CardCover'
  | 'CardModule'
  | 'CoverLayer'
  | 'Follow'
  | 'Media'
  | 'Post'
  | 'Profile'
  | 'User';

const dataProvider: DataProvider<ResourceType> = {
  async getList(resource, params): Promise<GetListResult> {
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

    query = query
      .orderBy(params.sort.field as any, params.sort.order.toLowerCase() as any)
      .limit(params.pagination.perPage)
      .offset((params.pagination.page - 1) * params.pagination.perPage);

    const data = await query.execute();
    const count = await countQuery
      .executeTakeFirstOrThrow()
      .then(({ count }) => sqlCountToNumber(count));

    return {
      data,
      total: count,
    };
  },
  async getOne(resource, params): Promise<GetOneResult> {
    return {
      data: await db
        .selectFrom(resource)
        .selectAll()
        .where('id', '=', params.id)
        .executeTakeFirstOrThrow(),
    };
  },
  async getMany(resource, params): Promise<GetManyResult> {
    return {
      data: await db
        .selectFrom(resource)
        .selectAll()
        .where('id', 'in', params.ids as any)
        .execute(),
    };
  },
  async getManyReference(_resource, _params) {
    //TODO not suported yet
    throw new Error('Not supported yet');
  },
  async update(resource, params) {
    await db
      .updateTable(resource)
      .set(params.data)
      .where('id', '=', params.id as any)
      .execute();

    return this.getOne(resource, params);
  },
  async updateMany(resource, params) {
    await db
      .updateTable(resource)
      .set(params.data)
      .where('id', 'in', params.ids as any)
      .execute();

    return { data: params.ids };
  },
  async create(resource, params) {
    const id = createId();
    const data = await db
      .insertInto(resource)
      .values({ id, ...params.data })
      .returning('id')
      .executeTakeFirstOrThrow();

    return this.getOne(resource, { id: data.id });
  },
  async delete(_resource, _params) {
    //TODO not suported yet
    throw new Error('Not supported yet');
  },
  async deleteMany(_resource, _params) {
    //TODO not suported yet
    throw new Error('Not supported yet');
  },
};
