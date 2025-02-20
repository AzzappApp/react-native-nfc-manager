import { GraphQLError } from 'graphql';
import { getActiveUserSubscriptions, getTotalMultiUser } from '@azzapp/data';
import { updateExistingSubscription } from '@azzapp/payment';
import ERRORS from '@azzapp/shared/errors';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { activeSubscriptionsForUserLoader, webCardOwnerLoader } from '#loaders';
import {
  calculateAvailableSeats,
  validateCurrentSubscription,
  updateMonthlySubscription,
  checkWebCardHasSubscription,
} from '../subscriptionHelpers';
import type { UserSubscription, WebCard } from '@azzapp/data';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getActiveUserSubscriptions: jest.fn(),
  getTotalMultiUser: jest.fn(),
  getCardModulesByWebCard: jest.fn(),
}));

jest.mock('@azzapp/payment', () => ({
  updateExistingSubscription: jest.fn(),
}));

jest.mock('@azzapp/shared/subscriptionHelpers', () => ({
  webCardRequiresSubscription: jest.fn(),
}));

jest.mock('#loaders', () => ({
  activeSubscriptionsForUserLoader: { load: jest.fn() },
  webCardOwnerLoader: { load: jest.fn() },
}));

describe('Subscription Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAvailableSeats', () => {
    test('should correctly calculate available seats', async () => {
      (getTotalMultiUser as jest.Mock).mockResolvedValue(2);
      const userSubscription = {
        userId: 'user-1',
        totalSeats: 5,
        freeSeats: 3,
      } as UserSubscription;

      const seats = await calculateAvailableSeats(userSubscription);

      expect(seats).toBe(6);
      expect(getTotalMultiUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('validateCurrentSubscription', () => {
    test('should throw SUBSCRIPTION_REQUIRED if no active subscription', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([]);

      await expect(validateCurrentSubscription('user-1', 3)).rejects.toThrow(
        new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED),
      );
    });

    test('should throw SUBSCRIPTION_INSUFFICIENT_SEATS if not enough seats', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.yearly', totalSeats: 2, userId: 'user-1' },
      ]);
      (getTotalMultiUser as jest.Mock).mockResolvedValue(3);

      await expect(validateCurrentSubscription('user-1', 3)).rejects.toThrow(
        new GraphQLError(ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS),
      );
    });
  });

  describe('updateMonthlySubscription', () => {
    test('should update monthly subscription with correct seats', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.monthly', userId: 'user-1' },
      ]);
      (getTotalMultiUser as jest.Mock).mockResolvedValue(4);

      await updateMonthlySubscription('user-1');

      expect(updateExistingSubscription).toHaveBeenCalledWith({
        userSubscription: expect.objectContaining({
          subscriptionPlan: 'web.monthly',
        }),
        totalSeats: 4,
      });
    });

    test('should do nothing if no monthly subscription is found', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([]);

      await updateMonthlySubscription('user-1');

      expect(updateExistingSubscription).not.toHaveBeenCalled();
    });
  });

  describe('checkWebCardHasSubscription', () => {
    test('should not throw if webCard does not require a subscription', async () => {
      (webCardRequiresSubscription as jest.Mock).mockReturnValue(false);

      await expect(
        checkWebCardHasSubscription({
          webCard: { id: 'webcard-1', cardIsPublished: true } as WebCard,
        }),
      ).resolves.not.toThrow();
    });

    test('should throw SUBSCRIPTION_REQUIRED if webCard requires a subscription and owner has none', async () => {
      (webCardRequiresSubscription as jest.Mock).mockReturnValue(true);
      (webCardOwnerLoader.load as jest.Mock).mockResolvedValue({
        id: 'owner-1',
      });
      (activeSubscriptionsForUserLoader.load as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        checkWebCardHasSubscription({
          webCard: { id: 'webcard-1', cardIsPublished: true } as WebCard,
        }),
      ).rejects.toThrow(new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED));
    });

    test('should not throw if owner has a valid subscription', async () => {
      (webCardRequiresSubscription as jest.Mock).mockReturnValue(true);
      (webCardOwnerLoader.load as jest.Mock).mockResolvedValue({
        id: 'owner-1',
      });
      (activeSubscriptionsForUserLoader.load as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.monthly', status: 'active' },
      ]);

      await expect(
        checkWebCardHasSubscription({
          webCard: { id: 'webcard-1', cardIsPublished: true } as WebCard,
        }),
      ).resolves.not.toThrow();
    });
  });
});
