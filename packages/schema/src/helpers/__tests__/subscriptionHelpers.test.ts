import { GraphQLError } from 'graphql';
import { getActiveUserSubscriptions, getTotalMultiUser } from '@azzapp/data';
import { updateExistingSubscription } from '@azzapp/payment';
import ERRORS from '@azzapp/shared/errors';
import {
  calculateAvailableSeats,
  validateCurrentSubscription,
  updateMonthlySubscription,
} from '../subscriptionHelpers';
import type { UserSubscription } from '@azzapp/data';

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

      await expect(
        validateCurrentSubscription('user-1', {
          webCardIsPublished: true,
          action: 'UPDATE_WEBCARD_KIND',
          webCardKind: 'business',
        }),
      ).rejects.toThrow(new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED));
    });

    test('should allow CREATE_CONTACT_CARD without a subscription if webCard is unpublished', async () => {
      await expect(
        validateCurrentSubscription('user-1', {
          action: 'CREATE_CONTACT_CARD',
          alreadyPublished: 0,
          webCardKind: 'personal',
          webCardIsPublished: false,
          contactCardHasCompanyName: false,
          contactCardHasUrl: false,
        }),
      ).resolves.toBeUndefined();
    });

    test('should throw SUBSCRIPTION_INSUFFICIENT_SEATS if not enough seats', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.yearly', totalSeats: 2, userId: 'user-1' },
      ]);
      (getTotalMultiUser as jest.Mock).mockResolvedValue(3);

      await expect(
        validateCurrentSubscription('user-1', {
          webCardIsPublished: true,
          action: 'UPDATE_MULTI_USER',
          addedSeats: 1,
        }),
      ).rejects.toThrow(
        new GraphQLError(ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS),
      );
    });

    test('should validate UPDATE_CONTACT_CARD if webCard is published', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.yearly', userId: 'user-1' },
      ]);

      await expect(
        validateCurrentSubscription('user-1', {
          action: 'UPDATE_CONTACT_CARD',
          webCardIsPublished: true,
          contactCardHasCompanyName: true,
          contactCardHasUrl: true,
        }),
      ).resolves.not.toThrow();
    });

    test('should validate UPDATE_WEBCARD_PUBLICATION with enough seats', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([
        {
          subscriptionPlan: 'web.yearly',
          userId: 'user-1',
          totalSeats: 5,
          freeSeats: 0,
        },
      ]);
      (getTotalMultiUser as jest.Mock).mockResolvedValue(3);

      await expect(
        validateCurrentSubscription('user-1', {
          action: 'UPDATE_WEBCARD_PUBLICATION',
          webCardKind: 'business',
          alreadyPublished: 1,
          addedSeats: 1,
          webCardIsMultiUser: true,
          webCardIsPublished: true,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('updateMonthlySubscription', () => {
    test('should update monthly subscription with correct seats', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.monthly', userId: 'user-1', status: 'active' },
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

    test('should not update canceled monthly subscription', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([
        {
          subscriptionPlan: 'web.monthly',
          userId: 'user-1',
          status: 'canceled',
        },
      ]);
      (getTotalMultiUser as jest.Mock).mockResolvedValue(4);

      await updateMonthlySubscription('user-1');

      expect(updateExistingSubscription).not.toHaveBeenCalled();
    });

    test('should default to at least 1 seat if total seats are 0', async () => {
      (getActiveUserSubscriptions as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.monthly', userId: 'user-1', status: 'active' },
      ]);
      (getTotalMultiUser as jest.Mock).mockResolvedValue(0);

      await updateMonthlySubscription('user-1');

      expect(updateExistingSubscription).toHaveBeenCalledWith({
        userSubscription: expect.objectContaining({
          subscriptionPlan: 'web.monthly',
        }),
        totalSeats: 1, // Minimum 1 seat enforced
      });
    });
  });
});
