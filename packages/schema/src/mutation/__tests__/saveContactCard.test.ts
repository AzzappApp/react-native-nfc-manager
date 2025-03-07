import {
  buildDefaultContactCard,
  getPushTokens,
  getUserById,
  referencesMedias,
  updateProfile,
} from '@azzapp/data';
import { notifyApplePassWallet, notifyGooglePassWallet } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, webCardLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import saveContactCard from '../saveContactCard';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  buildDefaultContactCard: jest.fn(),
  checkMedias: jest.fn(),
  getPushTokens: jest.fn(),
  referencesMedias: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateProfile: jest.fn(),
  getUserById: jest.fn(),
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
    hasGooglePass: true, // add flag for Google Wallet
  };

  const mockWebCard = {
    id: 'webcard-789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully update a contact card and notify Apple Wallet', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (buildDefaultContactCard as jest.Mock).mockResolvedValue({});
    (getPushTokens as jest.Mock).mockResolvedValue(['token1', 'token2']);
    (notifyApplePassWallet as jest.Mock).mockResolvedValue(undefined);
    (notifyGooglePassWallet as jest.Mock).mockResolvedValue(undefined);

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

  test('should not notify Google Wallet if `hasGooglePass` is false', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue({
      ...mockProfile,
      hasGooglePass: false, // deactivate Google Wallet
    });
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (getPushTokens as jest.Mock).mockResolvedValue(['token1']);
    (getUserById as jest.Mock).mockResolvedValue({ id: 'user-456' });

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
});
