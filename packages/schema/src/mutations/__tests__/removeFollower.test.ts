import { toGlobalId } from 'graphql-relay';
import { getFollows } from '@azzapp/data';
import {
  FollowFixture,
  ProfileFixture,
  UserFixture,
  WebCardFixture,
  createAppFixture,
} from '#testing/fixtures';

describe('Mutation: removeFollower', () => {
  const app = createAppFixture();

  const followerId = 'webcard-2';
  const user = UserFixture.generate({ id: '1' });
  const webCard = WebCardFixture.generate({
    id: '1',
    cardIsPrivate: true,
  });

  beforeAll(async () => {
    await app.load({
      user: [user],
      webCard: [webCard],
      profile: [
        ProfileFixture.generate({
          id: '1',
          userId: user.id,
          webCardId: webCard.id,
          profileRole: 'editor',
        }),
      ],
      follow: [
        FollowFixture.generate({
          followerId,
          followingId: webCard.id,
        }),
      ],
    });
  });

  describe('On successfully remove follower', () => {
    const webCardId = toGlobalId('WebCard', webCard.id);
    const removedFollowerId = toGlobalId('WebCard', followerId);

    let result: unknown;

    beforeAll(async () => {
      const { token } = await app.generateTokens({ userId: user.id });
      result = await app.executor({
        query: `
          mutation removeFollowerTest_removeFollowerMutation($webCardId: ID! $input: RemoveFollowerInput!) {
            removeFollower(webCardId: $webCardId, input: $input) {
              removedFollowerId
            }
          }
        `,
        variables: {
          webCardId,
          input: {
            removedFollowerId,
          },
        },
        extensions: {
          headers: {
            authorization: token,
          },
        },
      });
    });

    it('Should return removed follower', async () => {
      expect(result).toEqual({
        data: {
          removeFollower: {
            removedFollowerId: followerId,
          },
        },
      });
    });

    it('Should remove follower', async () => {
      const follows = await getFollows(followerId, webCard.id);
      expect(follows.length).toBe(0);
    });
  });

  it('Should throw ERRORS.FORBIDDEN if webcard is private', () => {});
  it('Should throw ERRORS.INTERNAL_SERVER_ERROR if follower to remove does not exist', () => {});
  it('Should throw INTERNAL_SERVER_ERROR otherwise', () => {});
});
