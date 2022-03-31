import * as uuid from 'uuid';
import { createObjectMapper, uuidMapping } from '../helpers/databaseUtils';
import { getClient } from './db';

export type User = {
  id: string;
  userName: string;
  email: string;
  password: string;
  locale?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  picture?: string | null;
};

const userSymbol = Symbol('User');

export const userMapper = createObjectMapper<User>(
  {
    id: uuidMapping,
  },
  userSymbol,
);

export const isUser = (val: any): val is User => {
  return val != null && val[userSymbol] === true;
};

export const getUserById = (id: string): Promise<User | null> =>
  getClient()
    .execute('SELECT * FROM users where id=?', [id])
    .then(result => userMapper.parse(result.first()));

export const getUserByEmail = (email: string): Promise<User | null> =>
  getClient()
    .execute('SELECT * FROM users WHERE email=?', [email])
    .then(result => userMapper.parse(result.first()));

export const getUserByUserName = (userName: string): Promise<User | null> =>
  getClient()
    .execute('SELECT * FROM users WHERE user_name=?', [userName])
    .then(result => userMapper.parse(result.first()));

export const createUser = async (user: Omit<User, 'id'>) => {
  const id = uuid.v4();
  const [query, params] = userMapper.createInsert('users', { id, ...user });
  await getClient().execute(query, params, { prepare: true });
  return id;
};

export const updateUser = async (
  userId: string,
  updates: Partial<Omit<User, 'id'>>,
) => {
  const [query, params] = userMapper.createUpdate('users', updates, {
    id: userId,
  });
  await getClient().execute(query, params, { prepare: true });
};
