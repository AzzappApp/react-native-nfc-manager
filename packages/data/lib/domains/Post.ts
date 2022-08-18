import * as uuid from 'uuid';
import { createObjectMapper, uuidMapping } from '../helpers/databaseUtils';
import { getClient } from './db';
import type { Media } from './commons';

export type Post = {
  postId: string;
  authorId: string;
  postDate: Date;
  media: Media;
  content: string;
  allowComments: boolean;
  allowLikes: boolean;
};

const postSymbol = Symbol('Post');

export const postMapper = createObjectMapper<Post>(
  {
    postId: uuidMapping,
    authorId: uuidMapping,
  },
  postSymbol,
);

export const isPost = (val: any): val is Post => {
  return val != null && val[postSymbol] === true;
};

export const getAllPosts = () =>
  getClient()
    .execute('SELECT * FROM posts')
    .then(result => result.rows.map(postMapper.parse));

// TODO we use a secondary index for this post_id lookup
// but we could just use the same strategy than with user card
// and use the primary key
export const getPostById = (id: string): Promise<Post | null> =>
  getClient()
    .execute('SELECT * FROM posts where post_id=?', [id])
    .then(result => postMapper.parse(result.first()));

export const getUserPosts = async (
  authorId: string,
  limit: number,
  bookmark?: string | null,
) => {
  let query =
    'SELECT * FROM posts WHERE author_id=? ORDER BY post_date DESC LIMIT ?';
  const params: any[] = [authorId, limit];
  if (bookmark) {
    query = `
      SELECT * FROM posts 
      WHERE post_date > ? AND author_id=?
      ORDER BY post_date DESC 
      LIMIT ?
    `;
    params.unshift(bookmark);
  }

  const result = await getClient().execute(query, params, { prepare: true });

  const rows = result.rows
    .map(row => postMapper.parse(row))
    .map(post => ({
      key: post.postDate.toUTCString(),
      doc: post,
    }));

  return {
    rows,
    bookmark: rows.length ? rows[rows.length - 1].key : null,
  };
};

export const getUsersPosts = async (
  authorsIds: string[],
  limit: number,
  bookmark?: string | null,
) => {
  let query =
    'SELECT * FROM posts WHERE author_id IN ? ORDER BY post_date DESC LIMIT ?';
  const params: any[] = [authorsIds, limit];
  if (bookmark) {
    query = `
      SELECT * FROM posts 
      WHERE post_date > ? AND author_id IN ?
      ORDER BY post_date DESC 
      LIMIT ?
    `;
    params.unshift(bookmark);
  }

  const result = await getClient().execute(query, params, { prepare: true });

  const rows = result.rows
    .map(row => postMapper.parse(row))
    .map(post => ({
      key: post.postDate.toUTCString(),
      doc: post,
    }));

  return {
    rows,
    bookmark: rows.length ? rows[rows.length - 1].key : null,
  };
};

export const createPost = async (post: Omit<Post, 'postDate' | 'postId'>) => {
  const postId = uuid.v4();
  const [query, params] = postMapper.createInsert('posts', {
    postId,
    postDate: new Date(),
    ...post,
  });
  await getClient().execute(query, params, { prepare: true });
  return postId;
};
