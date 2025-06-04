import { GraphQLError } from 'graphql';

import {
  createProfiles,
  createUsers,
  getUsersByEmail,
  getProfilesByWebCard,
  getDeletedUsersByEmail,
  updateUser,
  createUser,
  getProfilesByIds,
} from '@azzapp/data';

import ERRORS from '@azzapp/shared/errors';
import { sendPushNotification, notifyUsers } from '#externals';
import {
  webCardLoader,
  profileLoader,
  userLoader,
  webCardOwnerLoader,
} from '#loaders';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import inviteUsersListMutation from '../inviteUsersList';

jest.mock('@azzapp/data', () => ({
  createProfiles: jest.fn(),
  createUsers: jest.fn(),
  updateWebCard: jest.fn(),
  transaction: jest.fn(fn => fn()),
  getUsersByEmail: jest.fn(),
  getProfilesByWebCard: jest.fn(),
  getDeletedUsersByEmail: jest.fn(),
  updateUser: jest.fn(),
  createUser: jest.fn(),
  getProfilesByIds: jest.fn(),
  updateProfile: jest.fn(),
  createId: jest.fn(() => 'new-id'),
}));

jest.mock('#loaders', () => ({
  profileLoader: { load: jest.fn() },
  webCardLoader: { load: jest.fn() },
  userLoader: { load: jest.fn() },
  webCardOwnerLoader: { load: jest.fn() },
}));

jest.mock('#externals', () => ({
  notifyUsers: jest.fn(),
  sendPushNotification: jest.fn(),
}));

jest.mock('@azzapp/i18n', () => ({
  guessLocale: jest.fn(() => 'en'),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn(() => 'profile-123'));

jest.mock('@azzapp/shared/profileHelpers', () => ({
  profileHasAdminRight: jest.fn(() => true),
}));

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

const mockContext: any = {
  intl: { formatMessage: jest.fn(({ defaultMessage }) => defaultMessage) },
};
const mockInfo: any = {};

describe('inviteUsersListMutation', () => {
  const mockProfile = {
    id: 'profile-123',
    userId: 'user-1',
    profileRole: 'admin',
    webCardId: 'webcard-456',
  };

  const mockWebCard = {
    id: 'webcard-456',
    isMultiUser: false,
    cardIsPublished: true,
    userName: 'testUser',
  };

  const mockOwner = { id: 'owner-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser('user-1');
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (webCardOwnerLoader.load as jest.Mock).mockResolvedValue(mockOwner);
    (userLoader.load as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (getDeletedUsersByEmail as jest.Mock).mockResolvedValue([]);
    (createUsers as jest.Mock).mockResolvedValue(undefined);
    (getUsersByEmail as jest.Mock).mockResolvedValue([
      { id: 'u1', email: 'a@example.com' },
    ]);
    (getProfilesByWebCard as jest.Mock).mockResolvedValue([]);
    (createProfiles as jest.Mock).mockResolvedValue(['profile-999']);
    (getProfilesByIds as jest.Mock).mockResolvedValue([
      { id: 'profile-999', userId: 'u1' },
    ]);
  });

  test('should reject invalid email', async () => {
    const result = await inviteUsersListMutation(
      {},
      {
        profileId: 'global-profile-123',
        invited: [{ email: 'invalid', profileRole: 'user' }],
        sendInvite: false,
      },
      mockContext,
      mockInfo,
    );

    expect(result?.rejected).toEqual([
      expect.objectContaining({ reason: 'wrongEmail' }),
    ]);
  });

  test('should invite a user successfully', async () => {
    const result = await inviteUsersListMutation(
      {},
      {
        profileId: 'global-profile-123',
        invited: [
          { email: 'a@example.com', profileRole: 'user', contactCard: {} },
        ],
        sendInvite: true,
      },
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      rejected: [],
      added: [{ id: 'profile-999', userId: 'u1' }],
    });

    expect(sendPushNotification).toHaveBeenCalled();
    expect(notifyUsers).toHaveBeenCalledWith(
      'email',
      ['a@example.com'],
      mockWebCard,
      'invitation',
      'en',
    );
  });

  test('should reject profileRole "owner"', async () => {
    await expect(
      inviteUsersListMutation(
        {},
        {
          profileId: 'global-profile-123',
          invited: [{ email: 'a@example.com', profileRole: 'owner' }],
          sendInvite: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should reject if webCard is not found', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      inviteUsersListMutation(
        {},
        {
          profileId: 'global-profile-123',
          invited: [{ email: 'a@example.com', profileRole: 'user' }],
          sendInvite: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should recreate deleted user and update the old one', async () => {
    (getDeletedUsersByEmail as jest.Mock).mockResolvedValue([
      { id: 'deleted-1', email: 'a@example.com', deletedBy: 'deleted-1' },
    ]);
    (createUser as jest.Mock).mockResolvedValue('new-user-1');

    await inviteUsersListMutation(
      {},
      {
        profileId: 'global-profile-123',
        invited: [
          { email: 'a@example.com', profileRole: 'user', contactCard: {} },
        ],
        sendInvite: false,
      },
      mockContext,
      mockInfo,
    );

    expect(createUser).toHaveBeenCalledWith({
      email: 'a@example.com',
      id: 'new-id',
      invited: true,
    });
    expect(updateUser).toHaveBeenCalledWith('deleted-1', {
      appleId: null,
      email: null,
      phoneNumber: null,
      replacedBy: 'new-id',
    });
  });

  test('should reject blocked users (deletedBy !== id)', async () => {
    (getDeletedUsersByEmail as jest.Mock).mockResolvedValue([
      { id: 'u-blocked', email: 'a@example.com', deletedBy: 'someone-else' },
    ]);

    const result = await inviteUsersListMutation(
      {},
      {
        profileId: 'global-profile-123',
        invited: [
          { email: 'a@example.com', profileRole: 'user', contactCard: {} },
        ],
        sendInvite: false,
      },
      mockContext,
      mockInfo,
    );

    expect(result?.rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: 'userIsBlocked' }),
      ]),
    );
  });

  test('should throw UNAUTHORIZED if no session', async () => {
    mockUser();

    await expect(
      inviteUsersListMutation(
        {},
        {
          profileId: 'global-profile-123',
          invited: [],
          sendInvite: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });
});
