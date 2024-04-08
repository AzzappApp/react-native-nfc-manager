import type { Follow } from '@azzapp/data';

export const FollowFixture = {
  generate: (
    follow: Partial<Follow> & Pick<Follow, 'followerId' | 'followingId'>,
  ): Follow => {
    return {
      createdAt: new Date(),
      followerId: follow.followerId,
      followingId: follow.followingId,
    };
  },
};
