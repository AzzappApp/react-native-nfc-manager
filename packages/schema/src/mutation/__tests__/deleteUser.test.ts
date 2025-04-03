import { GraphQLError } from 'graphql';
import {
  getUserById,
  getUserProfilesWithWebCard,
  getWebCardsOwnerUsers,
  markUserAsDeleted,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { subscriptionsForUserLoader } from '#loaders';
import { updateMonthlySubscription } from '#helpers/subscriptionHelpers';
import deleteUser from '../deleteUser';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getUserById: jest.fn(),
  getUserProfilesWithWebCard: jest.fn(),
  getWebCardsOwnerUsers: jest.fn(),
  markUserAsDeleted: jest.fn(),
}));

jest.mock('#externals', () => ({
  invalidateWebCard: jest.fn(),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
}));

jest.mock('#loaders', () => ({
  subscriptionsForUserLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/subscriptionHelpers', () => ({
  updateMonthlySubscription: jest.fn(),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('deleteUser', () => {
  const mockUserProfiles = [
    {
      profile: { profileRole: 'owner' },
      webCard: { id: 'webcard-1', userName: 'testUser' },
    },
    { profile: { profileRole: 'editor' }, webCard: { id: 'webcard-2' } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully delete a user', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (subscriptionsForUserLoader.load as jest.Mock).mockResolvedValue([]);
    (markUserAsDeleted as jest.Mock).mockResolvedValue(undefined);
    (getUserProfilesWithWebCard as jest.Mock).mockResolvedValue(
      mockUserProfiles,
    );
    (getWebCardsOwnerUsers as jest.Mock).mockResolvedValue([{ id: 'owner-1' }]);
    (getUserById as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const result = await deleteUser({}, {}, mockContext, mockInfo);

    expect(markUserAsDeleted).toHaveBeenCalledWith('user-1', 'user-1');
    expect(invalidateWebCard).toHaveBeenCalledWith('testUser');
    expect(updateMonthlySubscription).toHaveBeenCalledWith('owner-1');
    expect(result).toEqual({ id: 'user-1' });
  });

  test('should throw UNAUTHORIZED if user is not authenticated', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: null });

    await expect(deleteUser({}, {}, mockContext, mockInfo)).rejects.toThrow(
      new GraphQLError(ERRORS.UNAUTHORIZED),
    );

    expect(markUserAsDeleted).not.toHaveBeenCalled();
  });

  test('should throw SUBSCRIPTION_IS_ACTIVE if user has an active subscription', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (subscriptionsForUserLoader.load as jest.Mock).mockResolvedValue([
      { subscriptionPlan: 'web.monthly', status: 'active' },
    ]);

    await expect(deleteUser({}, {}, mockContext, mockInfo)).rejects.toThrow(
      new GraphQLError(ERRORS.SUBSCRIPTION_IS_ACTIVE),
    );

    expect(markUserAsDeleted).not.toHaveBeenCalled();
  });

  test('should throw INVALID_REQUEST if user does not exist after deletion', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (subscriptionsForUserLoader.load as jest.Mock).mockResolvedValue([]);
    (markUserAsDeleted as jest.Mock).mockResolvedValue(undefined);
    (getUserProfilesWithWebCard as jest.Mock).mockResolvedValue(
      mockUserProfiles,
    );
    (getWebCardsOwnerUsers as jest.Mock).mockResolvedValue([{ id: 'owner-1' }]);
    (getUserById as jest.Mock).mockResolvedValue(null);

    await expect(deleteUser({}, {}, mockContext, mockInfo)).rejects.toThrow(
      new GraphQLError(ERRORS.INVALID_REQUEST),
    );

    expect(markUserAsDeleted).toHaveBeenCalledWith('user-1', 'user-1');
  });

  test('should throw INTERNAL_SERVER_ERROR if deletion fails', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (subscriptionsForUserLoader.load as jest.Mock).mockResolvedValue([]);
    (markUserAsDeleted as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(deleteUser({}, {}, mockContext, mockInfo)).rejects.toThrow(
      new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR),
    );

    expect(markUserAsDeleted).toHaveBeenCalledWith('user-1', 'user-1');
  });
});
