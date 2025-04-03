import { GraphQLError } from 'graphql';
import {
  getPushTokens,
  referencesMedias,
  transaction,
  updateProfile,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { notifyApplePassWallet, notifyGooglePassWallet } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, webCardLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import saveContactCard from '../saveContactCard';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  buildDefaultContactCard: jest.fn(),
  checkMedias: jest.fn(),
  getPushTokens: jest.fn(),
  getUserById: jest.fn(),
  referencesMedias: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateProfile: jest.fn(),
}));

jest.mock('#externals', () => ({
  notifyApplePassWallet: jest.fn(),
  notifyGooglePassWallet: jest.fn(),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
}));

jest.mock('#loaders', () => ({
  profileLoader: {
    load: jest.fn(),
  },
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('@sentry/nextjs', () => ({
  captureMessage: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

// Mock `fromGlobalIdWithType`
(fromGlobalIdWithType as jest.Mock).mockImplementation(
  (id: string, type: string) => {
    if (!id.startsWith('global-')) {
      throw new Error(`Invalid ID format for type ${type}`);
    }
    return id.replace('global-', '');
  },
);

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('saveContactCard', () => {
  const mockProfile = {
    id: 'profile-123',
    userId: 'user-456',
    contactCard: { urls: [], socials: [] },
    logoId: 'old-logo',
    avatarId: 'old-avatar',
    webCardId: 'webcard-789',
    hasGooglePass: true,
  };

  const mockWebCard = {
    id: 'webcard-789',
    cardIsPublished: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw UNAUTHORIZED if user is not authenticated', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: null });

    await expect(
      saveContactCard(
        {},
        {
          profileId: 'global-profile-123',
          contactCard: { avatarId: 'new-avatar' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should throw INVALID_REQUEST if profile is not found', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      saveContactCard(
        {},
        {
          profileId: 'global-profile-123',
          contactCard: { avatarId: 'new-avatar' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw UNAUTHORIZED if profile does not belong to user', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-999' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);

    await expect(
      saveContactCard(
        {},
        {
          profileId: 'global-profile-123',
          contactCard: { avatarId: 'new-avatar' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should throw INVALID_REQUEST if webCard is not found', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      saveContactCard(
        {},
        {
          profileId: 'global-profile-123',
          contactCard: { avatarId: 'new-avatar' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should validate subscription before updating', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (getPushTokens as jest.Mock).mockResolvedValue([]);

    await saveContactCard(
      {},
      {
        profileId: 'global-profile-123',
        contactCard: {
          avatarId: 'new-avatar',
          logoId: 'new-logo',
          company: 'name',
        },
      },
      mockContext,
      mockInfo,
    );

    expect(validateCurrentSubscription).toHaveBeenCalledWith('user-456', {
      action: 'UPDATE_CONTACT_CARD',
      contactCardHasCompanyName: true,
      webCardIsPublished: true,
      contactCardHasUrl: false,
      contactCardHasLogo: true,
    });
  });

  test('should update contact card and notify Apple & Google Wallet', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (getPushTokens as jest.Mock).mockResolvedValue(['token1', 'token2']);

    const result = await saveContactCard(
      {},
      {
        profileId: 'global-profile-123',
        contactCard: { avatarId: 'new-avatar' },
      },
      mockContext,
      mockInfo,
    );

    expect(updateProfile).toHaveBeenCalledWith(
      'profile-123',
      expect.any(Object),
    );
    expect(referencesMedias).toHaveBeenCalledWith(
      ['new-avatar'],
      ['old-logo', 'old-avatar'],
    );
    expect(notifyApplePassWallet).toHaveBeenCalledTimes(2);
    expect(notifyGooglePassWallet).toHaveBeenCalledWith(
      'profile-123',
      expect.any(String),
    );
    expect(result).toEqual(
      expect.objectContaining({ profile: expect.any(Object) }),
    );
  });

  test('should not notify Google Wallet if hasGooglePass is false', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue({
      ...mockProfile,
      hasGooglePass: false,
    });

    await saveContactCard(
      {},
      {
        profileId: 'global-profile-123',
        contactCard: { avatarId: 'new-avatar' },
      },
      mockContext,
      mockInfo,
    );

    expect(notifyGooglePassWallet).not.toHaveBeenCalled();
  });

  test('should throw INTERNAL_SERVER_ERROR on transaction failure', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (transaction as jest.Mock).mockRejectedValue(
      new Error('Transaction failed'),
    );

    await expect(
      saveContactCard(
        {},
        {
          profileId: 'global-profile-123',
          contactCard: { avatarId: 'new-avatar' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));
  });
});
