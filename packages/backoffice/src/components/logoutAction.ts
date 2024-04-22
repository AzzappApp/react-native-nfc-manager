'use server';

import { redirect } from 'next/navigation';
import { destroySessionServerActions } from '#helpers/session';

export const logout = () => {
  destroySessionServerActions();
  redirect('/login');
};
