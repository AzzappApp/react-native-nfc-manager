import { getClient } from './db';
import { userMapper } from './User';

export type Viewer = {
  userId?: string | null;
  isAnonymous: boolean;
};

export const getRecommandedUsers = async (
  viewer: Viewer,
  limit: number,
  bookmark?: string | null,
) => {
  let query = 'SELECT * FROM users LIMIT ?';
  const params: any[] = [limit];
  if (bookmark) {
    query = 'SELECT * FROM users WHERE token(id) > token(?) LIMIT ?';
    params.unshift(bookmark);
  }

  const result = await getClient()
    // TODO fail without prepare, is it necessary ?
    .execute(query, params, { prepare: true });

  const rows = result.rows.map(row => ({
    key: row.id,
    doc: userMapper.parse(row),
  }));

  return {
    rows,
    bookmark: rows.length ? rows[rows.length - 1].key : null,
  };
};
