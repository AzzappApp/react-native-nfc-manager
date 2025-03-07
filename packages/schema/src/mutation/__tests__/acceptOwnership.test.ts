import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import {
  getWebCardCountProfile,
  transaction,
  updateProfile,
  updateProfileForUserAndWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import {
  profileLoader,
  userLoader,
  webCardLoader,
  webCardOwnerLoader,
} from '#loaders';
import {
  updateMonthlySubscription,
  validateCurrentSubscription,
} from '#helpers/subscriptionHelpers';
import acceptOwnership from '../acceptOwnership';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getWebCardCountProfile: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateProfile: jest.fn(),
  updateProfileForUserAndWebCard: jest.fn(),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
}));

jest.mock('#loaders', () => ({
  profileLoader: {
    load: jest.fn(),
    prime: jest.fn(),
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

jest.mock('#helpers/subscriptionHelpers', () => ({
  updateMonthlySubscription: jest.fn(),
  validateCurrentSubscription: jest.fn(),
}));

jest.mock('graphql-relay', () => ({
  fromGlobalId: jest.fn(id => ({ id: id.replace('global-', '') })),
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('acceptOwnership', () => {
  const mockProfile = {
    id: 'profile-123',
    userId: 'user-1',
    webCardId: 'webcard-456',
    promotedAsOwner: true,
  };

  const mockUser = {
    id: 'user-1',
  };

  const mockWebCard = {
    id: 'webcard-456',
  };

  const mockOwner = {
    id: 'owner-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully accept ownership', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (userLoader.load as jest.Mock).mockResolvedValue(mockUser);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (webCardOwnerLoader.load as jest.Mock).mockResolvedValue(mockOwner);
    (getWebCardCountProfile as jest.Mock).mockResolvedValue(3);
    (validateCurrentSubscription as jest.Mock).mockResolvedValue(undefined);
    (updateProfile as jest.Mock).mockResolvedValue(undefined);

    const result = await acceptOwnership(
      {},
      { profileId: 'global-profile-123' },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalId).toHaveBeenCalledWith('global-profile-123');
    expect(profileLoader.load).toHaveBeenCalledWith('profile-123');
    expect(userLoader.load).toHaveBeenCalledWith('user-1');
    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(webCardOwnerLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(validateCurrentSubscription).toHaveBeenCalledWith('user-1', 3);
    expect(updateProfileForUserAndWebCard).toHaveBeenCalledWith(
      'owner-1',
      'webcard-456',
      { profileRole: 'admin' },
    );
    expect(updateMonthlySubscription).toHaveBeenCalledWith('owner-1');
    expect(updateProfile).toHaveBeenCalledWith('profile-123', {
      profileRole: 'owner',
      promotedAsOwner: false,
      invited: false,
    });
    expect(profileLoader.prime).toHaveBeenCalledWith(
      'profile-123',
      expect.objectContaining({ profileRole: 'owner' }),
    );

    expect(result).toEqual({
      profile: expect.objectContaining({
        profileRole: 'owner',
        promotedAsOwner: false,
      }),
    });
  });

  test('should throw UNAUTHORIZED if user is not authenticated', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: null });

    await expect(
      acceptOwnership(
        {},
        { profileId: 'global-profile-123' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(profileLoader.load).not.toHaveBeenCalled();
  });

  test('should throw UNAUTHORIZED if user is not the profile owner', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-2' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);

    await expect(
      acceptOwnership(
        {},
        { profileId: 'global-profile-123' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(webCardLoader.load).not.toHaveBeenCalled();
  });

  test('should throw INVALID_REQUEST if profile does not exist or is not promoted as owner', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (profileLoader.load as jest.Mock).mockResolvedValue({
      ...mockProfile,
      promotedAsOwner: false,
    });

    await expect(
      acceptOwnership(
        {},
        { profileId: 'global-profile-123' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_REQUEST if webCard does not exist', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      acceptOwnership(
        {},
        { profileId: 'global-profile-123' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INTERNAL_SERVER_ERROR if transaction fails', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (userLoader.load as jest.Mock).mockResolvedValue(mockUser);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (getWebCardCountProfile as jest.Mock).mockResolvedValue(3);
    (validateCurrentSubscription as jest.Mock).mockResolvedValue(undefined);
    (transaction as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(
      acceptOwnership(
        {},
        { profileId: 'global-profile-123' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));
  });
});
