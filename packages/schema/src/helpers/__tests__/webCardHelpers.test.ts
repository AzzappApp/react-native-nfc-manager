import {
  deleteRedirection,
  getContactCardAccessWithHasGooglePass,
  getProfilesWithHasGooglePass,
  getPushTokensFromWebCardId,
  getRedirectWebCardByUserName,
  getWebCardByUserName,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { notifyApplePassWallet, notifyGooglePassWallet } from '#externals';
import {
  isUserNameAvailable,
  notifyRelatedWalletPasses,
} from '../webCardHelpers';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getWebCardByUserName: jest.fn(),
  getRedirectWebCardByUserName: jest.fn(),
  deleteRedirection: jest.fn(),
  getPushTokensFromWebCardId: jest.fn(),
  getProfilesWithHasGooglePass: jest.fn(),
  getContactCardAccessWithHasGooglePass: jest.fn(),
}));

jest.mock('#externals', () => ({
  notifyApplePassWallet: jest.fn(),
  notifyGooglePassWallet: jest.fn(),
}));

describe('isUserNameAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return available = true when the username is not in use', async () => {
    (getWebCardByUserName as jest.Mock).mockResolvedValue(null);
    (getRedirectWebCardByUserName as jest.Mock).mockResolvedValue([]);

    const result = await isUserNameAvailable('newUsername');

    expect(result).toEqual({ available: true, userName: 'newUsername' });
  });

  test('should return available = false when the username is already taken', async () => {
    (getWebCardByUserName as jest.Mock).mockResolvedValue({ id: '123' });

    const result = await isUserNameAvailable('takenUsername');

    expect(result).toEqual({ available: false, userName: 'takenUsername' });
  });

  test('should return available = false when there is an active redirection', async () => {
    (getWebCardByUserName as jest.Mock).mockResolvedValue(null);
    (getRedirectWebCardByUserName as jest.Mock).mockResolvedValue([
      { expiresAt: new Date(Date.now() + 10000), fromUserName: 'oldUsername' },
    ]);

    const result = await isUserNameAvailable('redirectedUsername');

    expect(result).toEqual({
      available: false,
      userName: 'redirectedUsername',
    });
    expect(deleteRedirection).not.toHaveBeenCalled();
  });

  test('should delete expired redirection and return available = true', async () => {
    (getWebCardByUserName as jest.Mock).mockResolvedValue(null);
    (getRedirectWebCardByUserName as jest.Mock).mockResolvedValue([
      {
        expiresAt: new Date(Date.now() - 10000),
        fromUserName: 'expiredRedirect',
      },
    ]);

    const result = await isUserNameAvailable('expiredRedirect');

    expect(deleteRedirection).toHaveBeenCalledWith('expiredRedirect');
    expect(result).toEqual({ available: true, userName: 'expiredRedirect' });
  });
});

describe('notifyRelatedWalletPasses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should notify Apple Wallet only when push tokens exist', async () => {
    (getPushTokensFromWebCardId as jest.Mock).mockResolvedValue([
      'token1',
      'token2',
    ]);
    (getProfilesWithHasGooglePass as jest.Mock).mockResolvedValue([]);
    (getContactCardAccessWithHasGooglePass as jest.Mock).mockResolvedValue([]);

    await notifyRelatedWalletPasses('webcard-123');

    expect(notifyApplePassWallet).toHaveBeenCalledTimes(2); // Deux tokens = 2 appels
    expect(notifyGooglePassWallet).not.toHaveBeenCalled();
  });

  test('should notify Google Wallet only when profiles with Google passes exist', async () => {
    (getPushTokensFromWebCardId as jest.Mock).mockResolvedValue([]);
    (getProfilesWithHasGooglePass as jest.Mock).mockResolvedValue([
      { profileId: 'profile-1', userLocale: 'fr' },
      { profileId: 'profile-2', userLocale: null },
    ]);
    (getContactCardAccessWithHasGooglePass as jest.Mock).mockResolvedValue([
      { contactCardAccessId: 'contactCardAccess-3', userLocale: null },
    ]);

    await notifyRelatedWalletPasses('webcard-123');

    expect(notifyApplePassWallet).not.toHaveBeenCalled();
    expect(notifyGooglePassWallet).toHaveBeenCalledTimes(3);
    expect(notifyGooglePassWallet).toHaveBeenCalledWith('profile-1', 'fr');
    expect(notifyGooglePassWallet).toHaveBeenCalledWith(
      'profile-2',
      DEFAULT_LOCALE,
    );
    expect(notifyGooglePassWallet).toHaveBeenCalledWith(
      'contactCardAccess-3',
      DEFAULT_LOCALE,
    );
  });

  test('should notify both Apple and Google Wallets when both push tokens and profiles exist', async () => {
    (getPushTokensFromWebCardId as jest.Mock).mockResolvedValue(['token1']);
    (getProfilesWithHasGooglePass as jest.Mock).mockResolvedValue([
      { profileId: 'profile-1', userLocale: 'fr' },
    ]);
    (getContactCardAccessWithHasGooglePass as jest.Mock).mockResolvedValue([]);

    await notifyRelatedWalletPasses('webcard-123');

    expect(notifyApplePassWallet).toHaveBeenCalledTimes(1);
    expect(notifyGooglePassWallet).toHaveBeenCalledTimes(1);
  });

  test('should notify only Apple when requested', async () => {
    (getPushTokensFromWebCardId as jest.Mock).mockResolvedValue(['token1']);

    await notifyRelatedWalletPasses('webcard-123', true);

    expect(notifyApplePassWallet).toHaveBeenCalledTimes(1);
    expect(notifyGooglePassWallet).toHaveBeenCalledTimes(0);
  });

  test('should not notify any Wallet if there are no push tokens or Google passes', async () => {
    (getPushTokensFromWebCardId as jest.Mock).mockResolvedValue([]);
    (getProfilesWithHasGooglePass as jest.Mock).mockResolvedValue([]);
    (getContactCardAccessWithHasGooglePass as jest.Mock).mockResolvedValue([]);

    await notifyRelatedWalletPasses('webcard-123');

    expect(notifyApplePassWallet).not.toHaveBeenCalled();
    expect(notifyGooglePassWallet).not.toHaveBeenCalled();
  });
});
