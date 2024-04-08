import { toGlobalId } from 'graphql-relay';
import { getUserByEmail } from '@azzapp/data';
import {
  ProfileFixture,
  UserFixture,
  WebCardFixture,
  createAppFixture,
} from '#testing/fixtures';

describe('Mutation: inviteUser', () => {
  const app = createAppFixture();

  const user = UserFixture.generate({ id: '1' });
  const webCard = WebCardFixture.generate({
    id: '1',
    cardIsPrivate: true,
  });
  const profile = ProfileFixture.generate({
    id: '1',
    userId: user.id,
    webCardId: webCard.id,
    profileRole: 'owner',
  });

  beforeAll(async () => {
    await app.load({
      user: [user],
      webCard: [webCard],
      profile: [profile],
    });
  });

  describe('On successful invite new user', () => {
    const profileId = toGlobalId('Profile', profile.id);

    let result: unknown;

    beforeAll(async () => {
      const { token } = await app.generateTokens({ userId: user.id });
      result = await app.executor({
        query: `
          mutation inviteUserTest_inviteUserMutation($profileId: ID! $invited: InviteUserInput!) {
            inviteUser(profileId: $profileId, invited: $invited) {
              profile {
                id
                profileRole
                contactCard {
                  firstName
                  lastName
                }
              }
            }
          }
        `,
        variables: {
          profileId,
          invited: {
            email: 'invited-user@gmail.com',
            profileRole: 'admin',
          },
        },
        extensions: {
          headers: {
            authorization: token,
          },
        },
      });
    });

    it('Should return invited user profile', () => {
      expect(result).toEqual({
        data: {
          inviteUser: {
            profile: {
              contactCard: {
                firstName: null,
                lastName: null,
              },
              id: expect.any(String),
              profileRole: 'admin',
            },
          },
        },
      });
    });

    it('Should create invited user', async () => {
      const invited = await getUserByEmail('invited-user@gmail.com');
      expect(invited).toEqual({
        id: expect.any(String),
        email: 'invited-user@gmail.com',
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
        emailConfirmed: false,
        invited: true,
        locale: null,
        password: null,
        phoneNumber: null,
        phoneNumberConfirmed: false,
        roles: null,
      });
    });
  });
});
