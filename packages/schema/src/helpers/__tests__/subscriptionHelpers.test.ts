import { GraphQLError } from 'graphql';
import {
  getUserSubscriptions,
  getTotalMultiUser,
  getUserById,
  updateNbFreeScans,
} from '@azzapp/data';
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
  getUserSubscriptions: jest.fn(),
  getTotalMultiUser: jest.fn(),
  getUserById: jest.fn(),
  updateNbFreeScans: jest.fn(),
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

    test('should return correct seats when totalUsed is 0', async () => {
      (getTotalMultiUser as jest.Mock).mockResolvedValue(0);
      const userSubscription = {
        userId: 'user-2',
        totalSeats: 10,
        freeSeats: 2,
      } as UserSubscription;

      const seats = await calculateAvailableSeats(userSubscription);

      expect(seats).toBe(12);
    });
  });

  describe('validateCurrentSubscription', () => {
    test('should throw SUBSCRIPTION_REQUIRED if no active subscription', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([]);

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

    test('should update free scans if ADD_CONTACT_WITH_SCAN is used without a subscription', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([]);

      await validateCurrentSubscription('user-1', {
        action: 'ADD_CONTACT_WITH_SCAN',
      });

      expect(updateNbFreeScans).toHaveBeenCalledWith('user-1');
    });

    test('should throw SUBSCRIPTION_REQUIRED if free scans exceed limit in USE_SCAN', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([]);
      (getUserById as jest.Mock).mockResolvedValue({
        id: 'user-1',
        nbFreeScans: 6,
      });

      await expect(
        validateCurrentSubscription('user-1', { action: 'USE_SCAN' }),
      ).rejects.toThrow(new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED));
    });

    test('should not throw error if free scans are below limit in USE_SCAN', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([]);
      (getUserById as jest.Mock).mockResolvedValue({
        id: 'user-1',
        nbFreeScans: 4,
      });

      await expect(
        validateCurrentSubscription('user-1', { action: 'USE_SCAN' }),
      ).resolves.not.toThrow();
    });

    test('should allow lifetime subscription without checking seats', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.lifetime', userId: 'user-1' },
      ]);

      await expect(
        validateCurrentSubscription('user-1', {
          webCardIsPublished: true,
          action: 'UPDATE_MULTI_USER',
          addedSeats: 5,
        }),
      ).resolves.not.toThrow();
    });

    test('should allow yearly subscription if there are enough seats', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([
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
          webCardIsPublished: true,
          action: 'UPDATE_MULTI_USER',
          addedSeats: 1,
        }),
      ).resolves.not.toThrow();
    });

    test('should do nothing if the webCard is not published', async () => {
      await expect(
        validateCurrentSubscription('user-1', {
          webCardIsPublished: false,
          action: 'UPDATE_WEBCARD_KIND',
          webCardKind: 'business',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('updateMonthlySubscription', () => {
    test('should update monthly subscription with correct seats', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([
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
      (getUserSubscriptions as jest.Mock).mockResolvedValue([
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

    test('should not update if no active monthly subscription is found', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([]);

      await updateMonthlySubscription('user-1');

      expect(updateExistingSubscription).not.toHaveBeenCalled();
    });

    test('should default to at least 1 seat if total seats are 0', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([
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

  describe('validateCurrentSubscription - UPDATE_CONTACT_CARD', () => {
    test('should throw SUBSCRIPTION_REQUIRED if no active subscription and contact card has company name', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([]);

      await expect(
        validateCurrentSubscription('user-1', {
          action: 'UPDATE_CONTACT_CARD',
          webCardIsPublished: true,
          contactCardHasCompanyName: true,
          contactCardHasUrl: false,
          contactCardHasLogo: false,
        }),
      ).rejects.toThrow(new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED));
    });

    test('should throw SUBSCRIPTION_REQUIRED if no active subscription and contact card has a URL', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([]);

      await expect(
        validateCurrentSubscription('user-1', {
          action: 'UPDATE_CONTACT_CARD',
          webCardIsPublished: true,
          contactCardHasCompanyName: false,
          contactCardHasUrl: true,
          contactCardHasLogo: false,
        }),
      ).rejects.toThrow(new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED));
    });

    test('should throw SUBSCRIPTION_REQUIRED if no active subscription and contact card has a logo', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([]);

      await expect(
        validateCurrentSubscription('user-1', {
          action: 'UPDATE_CONTACT_CARD',
          webCardIsPublished: true,
          contactCardHasCompanyName: false,
          contactCardHasUrl: false,
          contactCardHasLogo: true,
        }),
      ).rejects.toThrow(new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED));
    });

    test('should allow UPDATE_CONTACT_CARD without a subscription if contact card has no company name, URL, or logo', async () => {
      await expect(
        validateCurrentSubscription('user-1', {
          action: 'UPDATE_CONTACT_CARD',
          webCardIsPublished: true,
          contactCardHasCompanyName: false,
          contactCardHasUrl: false,
          contactCardHasLogo: false,
        }),
      ).resolves.toBeUndefined();
    });

    test('should allow UPDATE_CONTACT_CARD if user has an active subscription', async () => {
      (getUserSubscriptions as jest.Mock).mockResolvedValue([
        { subscriptionPlan: 'web.yearly', userId: 'user-1' },
      ]);

      await expect(
        validateCurrentSubscription('user-1', {
          action: 'UPDATE_CONTACT_CARD',
          webCardIsPublished: true,
          contactCardHasCompanyName: true,
          contactCardHasUrl: true,
          contactCardHasLogo: true,
        }),
      ).resolves.not.toThrow();
    });
  });
});
