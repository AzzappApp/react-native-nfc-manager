import { GraphQLError } from 'graphql';
import {
  getWebCardCountProfile,
  removeWebCardNonOwnerProfiles,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader, webCardOwnerLoader } from '#loaders';
import { checkWebCardOwnerProfile } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import {
  updateMonthlySubscription,
  validateCurrentSubscription,
} from '#helpers/subscriptionHelpers';
import updateMultiUser from '../updateMultiUser';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getWebCardCountProfile: jest.fn(),
  removeWebCardNonOwnerProfiles: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateWebCard: jest.fn(),
}));

jest.mock('#externals', () => ({
  invalidateWebCard: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardLoader: {
    load: jest.fn(),
  },
  webCardOwnerLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardOwnerProfile: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
  updateMonthlySubscription: jest.fn(),
}));

// Mock context and info
const mockContext: any = { apiEndpoint: 'https://api.example.com' };
const mockInfo: any = {};

describe('updateMultiUser', () => {
  const mockWebCard = {
    id: 'webcard-123',
    isMultiUser: false,
    userName: 'testUser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully enable multi-user mode', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardOwnerProfile as jest.Mock).mockResolvedValue(undefined);
    (webCardOwnerLoader.load as jest.Mock).mockResolvedValue({ id: 'owner-1' });
    (getWebCardCountProfile as jest.Mock).mockResolvedValue(3);
    (validateCurrentSubscription as jest.Mock).mockResolvedValue(undefined);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    const result = await updateMultiUser(
      {},
      { webCardId: 'global-webcard-123', input: { isMultiUser: true } },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalIdWithType).toHaveBeenCalledWith(
      'global-webcard-123',
      'WebCard',
    );
    expect(checkWebCardOwnerProfile).toHaveBeenCalledWith('webcard-123');
    expect(validateCurrentSubscription).toHaveBeenCalledWith(
      'owner-1',
      {
        action: 'UPDATE_MULTI_USER',
        addedSeats: 3,
      },
      mockContext.apiEndpoint,
    );
    expect(updateWebCard).toHaveBeenCalledWith('webcard-123', {
      isMultiUser: true,
    });
    expect(invalidateWebCard).toHaveBeenCalledWith('testUser');

    expect(result).toEqual({ webCard: { ...mockWebCard, isMultiUser: true } });
  });

  test('should successfully disable multi-user mode and remove non-owner profiles', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardOwnerProfile as jest.Mock).mockResolvedValue(undefined);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (webCardOwnerLoader.load as jest.Mock).mockResolvedValue({ id: 'owner-1' });
    const result = await updateMultiUser(
      {},
      { webCardId: 'global-webcard-123', input: { isMultiUser: false } },
      mockContext,
      mockInfo,
    );

    expect(updateWebCard).toHaveBeenCalledWith('webcard-123', {
      isMultiUser: false,
    });
    expect(removeWebCardNonOwnerProfiles).toHaveBeenCalledWith('webcard-123');
    expect(invalidateWebCard).toHaveBeenCalledWith('testUser');
    expect(updateMonthlySubscription).toHaveBeenCalledWith(
      'owner-1',
      mockContext.apiEndpoint,
    );
    expect(result).toEqual({ webCard: mockWebCard });
  });

  test('should throw UNAUTHORIZED if user is not the owner', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardOwnerProfile as jest.Mock).mockRejectedValue(
      new GraphQLError(ERRORS.UNAUTHORIZED),
    );

    await expect(
      updateMultiUser(
        {},
        { webCardId: 'global-webcard-123', input: { isMultiUser: true } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(updateWebCard).not.toHaveBeenCalled();
  });

  test('should throw INVALID_REQUEST if web card is not found during update', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardOwnerProfile as jest.Mock).mockResolvedValue(undefined);
    (webCardOwnerLoader.load as jest.Mock).mockResolvedValue({ id: 'owner-1' });
    (getWebCardCountProfile as jest.Mock).mockResolvedValue(3);
    (validateCurrentSubscription as jest.Mock).mockResolvedValue(undefined);
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      updateMultiUser(
        {},
        { webCardId: 'global-webcard-123', input: { isMultiUser: true } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should not validate subscription if disabling multi-user mode', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardOwnerProfile as jest.Mock).mockResolvedValue(undefined);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    await updateMultiUser(
      {},
      { webCardId: 'global-webcard-123', input: { isMultiUser: false } },
      mockContext,
      mockInfo,
    );

    expect(validateCurrentSubscription).not.toHaveBeenCalled();
  });
});
