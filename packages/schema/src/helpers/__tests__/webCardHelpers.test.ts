import {
  deleteRedirection,
  getRedirectWebCardByUserName,
  getWebCardByUserName,
} from '@azzapp/data';
import { isUserNameAvailable } from '../webCardHelpers'; // Adjust path if needed

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getWebCardByUserName: jest.fn(),
  getRedirectWebCardByUserName: jest.fn(),
  deleteRedirection: jest.fn(),
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

  test('should return available = false when multiple redirections exist but username is taken', async () => {
    (getWebCardByUserName as jest.Mock).mockResolvedValue({ id: '123' });
    (getRedirectWebCardByUserName as jest.Mock).mockResolvedValue([
      { expiresAt: new Date(Date.now() - 10000), fromUserName: 'redirect1' },
      { expiresAt: new Date(Date.now() + 10000), fromUserName: 'redirect2' },
    ]);

    const result = await isUserNameAvailable('takenUsername');

    expect(result).toEqual({ available: false, userName: 'takenUsername' });
    expect(deleteRedirection).not.toHaveBeenCalled();
  });
});
