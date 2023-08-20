'use server';
import * as bcrypt from 'bcrypt-ts';
import isEmail from 'validator/lib/isEmail';
import { getUserByEmail } from '@azzapp/data/domains';
import { setSessionServerActions } from '#helpers/session';

export type LoginErrors = {
  email?: string;
  password?: string;
  failed?: string;
};

export const login = async (data: FormData): Promise<LoginErrors | null> => {
  const email = data.get('email');
  const password = data.get('password');

  if (!email) {
    return { email: 'Email is required' };
  }

  if (!(typeof email === 'string') || !isEmail(email)) {
    return { email: 'Invalid email' };
  }

  if (!(typeof password === 'string') || !password) {
    return { password: 'Password is required' };
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return { failed: 'Invalid email or password' };
  }

  if (!bcrypt.compareSync(password, user.password!)) {
    return { failed: 'Invalid email or password' };
  }

  await setSessionServerActions({
    userId: user.id,
  });

  return null;
};
