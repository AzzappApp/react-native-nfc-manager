import { GraphQLError } from 'graphql';
import {
  createProfile,
  createUser,
  getProfileByUserAndWebCard,
  getUserByEmailPhoneNumber,
  updateUser,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { notifyUsers } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import {
  profileLoader,
  userLoader,
  webCardLoader,
  webCardOwnerLoader,
} from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import inviteUserMutation from '../inviteUser';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  checkMedias: jest.fn(),
  createProfile: jest.fn(),
  createUser: jest.fn(),
  getProfileByUserAndWebCard: jest.fn(),
  getUserByEmailPhoneNumber: jest.fn(),
  referencesMedias: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateProfile: jest.fn(),
  updateWebCard: jest.fn(),
  updateUser: jest.fn(),
  createId: jest.fn(() => 'new-id'),
}));

jest.mock('@azzapp/i18n', () => ({
  guessLocale: jest.fn(() => 'en'),
}));

jest.mock('@azzapp/shared/profileHelpers', () => ({
  profileHasAdminRight: jest.fn(() => true),
}));

jest.mock('@azzapp/shared/stringHelpers', () => ({
  formatPhoneNumber: jest.fn(phone => `formatted-${phone}`),
  isInternationalPhoneNumber: jest.fn(() => true),
  isValidEmail: jest.fn(() => true),
}));

jest.mock('#externals', () => ({
  notifyUsers: jest.fn(),
  sendPushNotification: jest.fn(),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
}));

jest.mock('#loaders', () => ({
  profileLoader: {
    load: jest.fn(),
  },
  userLoader: {
    load: jest.fn(),
  },
  webCardLoader: {
    load: jest.fn(),
  },
  webCardOwnerLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('inviteUserMutation', () => {
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
  });

  test('should successfully invite a new user', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('profile-123');
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (webCardOwnerLoader.load as jest.Mock).mockResolvedValue(mockOwner);
    (userLoader.load as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (getUserByEmailPhoneNumber as jest.Mock).mockResolvedValue(null);
    (createUser as jest.Mock).mockResolvedValue('new-user-456');
    (createProfile as jest.Mock).mockResolvedValue('new-profile-789');

    const result = await inviteUserMutation(
      {},
      {
        profileId: 'global-profile-123',
        invited: {
          email: 'test@example.com',
          profileRole: 'editor',
          contactCard: {},
        },
        sendInvite: true,
      },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalIdWithType).toHaveBeenCalledWith(
      'global-profile-123',
      'Profile',
    );
    expect(profileLoader.load).toHaveBeenCalledWith('profile-123');
    expect(getUserByEmailPhoneNumber).toHaveBeenCalledWith(
      'test@example.com',
      undefined,
    );
    expect(createUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      phoneNumber: undefined,
      invited: true,
    });
    expect(createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'new-user-456' }),
    );
    expect(notifyUsers).toHaveBeenCalledWith(
      'email',
      ['test@example.com'],
      mockWebCard,
      'invitation',
      'en',
    );
    expect(result).toEqual({
      profile: expect.objectContaining({ id: 'new-profile-789' }),
    });
  });

  test('should throw UNAUTHORIZED if user is not authenticated', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: null });

    await expect(
      inviteUserMutation(
        {},
        {
          profileId: 'global-profile-123',
          invited: {
            profileRole: 'admin',
          },
          sendInvite: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should throw INVALID_REQUEST if email and phone are missing', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });

    await expect(
      inviteUserMutation(
        {},
        {
          profileId: 'global-profile-123',
          invited: {
            profileRole: 'user',
          },
          sendInvite: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_REQUEST if profileRole is owner', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });

    await expect(
      inviteUserMutation(
        {},
        {
          profileId: 'global-profile-123',
          invited: {
            profileRole: 'owner',
            email: 'test@example.com',
          },
          sendInvite: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_REQUEST if webCard, owner, or user is missing', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      inviteUserMutation(
        {},
        {
          profileId: 'global-profile-123',
          invited: {
            email: 'test@example.com',
            profileRole: 'user',
          },
          sendInvite: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw PROFILE_ALREADY_EXISTS if user already has a profile on the webCard', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (getUserByEmailPhoneNumber as jest.Mock).mockResolvedValue({
      id: 'existing-user',
    });
    (getProfileByUserAndWebCard as jest.Mock).mockResolvedValue({
      id: 'existing-profile',
    });

    await expect(
      inviteUserMutation(
        {},
        {
          profileId: 'global-profile-123',
          invited: {
            email: 'test@example.com',
            profileRole: 'user',
          },
          sendInvite: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.PROFILE_ALREADY_EXISTS));
  });

  test('should recreate deleted user and update old user as replaced', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('profile-123');
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue({
      ...mockWebCard,
      isMultiUser: true,
    });
    (webCardOwnerLoader.load as jest.Mock).mockResolvedValue(mockOwner);
    (userLoader.load as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (getUserByEmailPhoneNumber as jest.Mock).mockResolvedValue({
      id: 'deleted-user-1',
      email: 'deleted@example.com',
      deleted: true,
      deletedBy: 'deleted-user-1',
    });
    (createUser as jest.Mock).mockResolvedValue('new-user-1');
    (createProfile as jest.Mock).mockResolvedValue('new-profile-123');
    (getProfileByUserAndWebCard as jest.Mock).mockResolvedValue(null);

    const result = await inviteUserMutation(
      {},
      {
        profileId: 'global-profile-123',
        invited: {
          email: 'deleted@example.com',
          profileRole: 'user',
          contactCard: {},
        },
        sendInvite: false,
      },
      mockContext,
      mockInfo,
    );

    expect(createUser).toHaveBeenCalledWith({
      id: 'new-id',
      email: 'deleted@example.com',
      phoneNumber: undefined,
      invited: true,
    });

    expect(updateUser).toHaveBeenCalledWith('deleted-user-1', {
      appleId: null,
      email: null,
      phoneNumber: null,
      replacedBy: 'new-id',
    });

    expect(result).toEqual({
      profile: expect.objectContaining({
        id: 'new-profile-123',
        userId: 'new-id',
        profileRole: 'user',
      }),
    });
  });
});
