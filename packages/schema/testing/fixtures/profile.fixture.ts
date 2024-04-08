import type { Profile } from '@azzapp/data';

export const ProfileFixture = {
  generate: (
    partial: Partial<Profile> & Pick<Profile, 'id' | 'userId' | 'webCardId'>,
  ): Profile => {
    const creationDate = new Date();

    const { id, userId, webCardId, ...profile } = partial;
    return {
      id: `profile-${id}`,
      avatarId: null,
      contactCard: null,
      contactCardDisplayedOnWebCard: true,
      contactCardIsPrivate: false,
      createdAt: creationDate,
      invited: false,
      lastContactCardUpdate: creationDate,
      nbContactCardScans: 0,
      profileRole: 'user',
      promotedAsOwner: false,
      userId,
      webCardId,
      inviteSent: false,
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      ...profile,
    };
  },
};
