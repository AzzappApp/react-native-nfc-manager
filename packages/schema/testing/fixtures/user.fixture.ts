import type { User } from '@azzapp/data';

export const UserFixture = {
  generate: (partial: Partial<User> & Pick<User, 'id'>): User => {
    const creationDate = new Date();

    const { id, ...user } = partial;

    return {
      id: `user-${id}`,
      email: `user-${id}@company.com`,
      invited: false,
      locale: 'fr',
      password: `user${id}password`,
      phoneNumber: null,
      roles: ['admin'],
      createdAt: creationDate,
      updatedAt: creationDate,
      emailConfirmed: true,
      phoneNumberConfirmed: true,
      ...user,
    };
  },
};
