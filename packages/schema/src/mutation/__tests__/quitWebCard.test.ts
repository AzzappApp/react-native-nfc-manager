import { GraphQLError } from 'graphql';
import { markWebCardAsDeleted, removeProfile } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { profileByWebCardIdAndUserIdLoader, webCardLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { updateMonthlySubscription } from '#helpers/subscriptionHelpers';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import quitWebCard from '../quitWebCard';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  markWebCardAsDeleted: jest.fn(),
  removeProfile: jest.fn(),
  transaction: jest.fn(callback => callback()),
}));

jest.mock('#externals', () => ({
  invalidateWebCard: jest.fn(),
}));

jest.mock('#loaders', () => ({
  profileByWebCardIdAndUserIdLoader: {
    load: jest.fn(),
  },
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#helpers/subscriptionHelpers', () => ({
  updateMonthlySubscription: jest.fn(),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('quitWebCard', () => {
  const mockProfileOwner = {
    id: 'profile-123',
    webCardId: 'webcard-456',
    profileRole: 'owner',
  };

  const mockProfileUser = {
    id: 'profile-789',
    webCardId: 'webcard-456',
    profileRole: 'editor',
  };

  const mockWebCard = {
    id: 'webcard-456',
    userName: 'testWebCard',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully quit a web card as owner (deletes web card)', async () => {
    mockUser('user-1');
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-456');
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue(
      mockProfileOwner,
    );
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    const result = await quitWebCard(
      {},
      { webCardId: 'global-webcard-456' },
      mockContext,
      mockInfo,
    );

    expect(markWebCardAsDeleted).toHaveBeenCalledWith('webcard-456', 'user-1');
    expect(updateMonthlySubscription).toHaveBeenCalledWith('user-1');
    expect(invalidateWebCard).toHaveBeenCalledWith('testWebCard');

    expect(result).toEqual({ webCardId: 'global-webcard-456' });
  });

  test('should successfully quit a web card as a non-owner (removes profile)', async () => {
    mockUser('user-2');
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-456');
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue(
      mockProfileUser,
    );
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    const result = await quitWebCard(
      {},
      { webCardId: 'global-webcard-456' },
      mockContext,
      mockInfo,
    );

    expect(removeProfile).toHaveBeenCalledWith('profile-789', 'user-2');
    expect(updateMonthlySubscription).toHaveBeenCalledWith('user-2');
    expect(invalidateWebCard).not.toHaveBeenCalled(); // Non-owner case doesn't invalidate the web card

    expect(result).toEqual({ webCardId: 'global-webcard-456' });
  });

  test('should throw UNAUTHORIZED if user is not authenticated', async () => {
    mockUser();

    await expect(
      quitWebCard(
        {},
        { webCardId: 'global-webcard-456' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(markWebCardAsDeleted).not.toHaveBeenCalled();
    expect(removeProfile).not.toHaveBeenCalled();
  });

  test('should throw PROFILE_DONT_EXISTS if profile is not found', async () => {
    mockUser('user-3');
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-456');
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      quitWebCard(
        {},
        { webCardId: 'global-webcard-456' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.PROFILE_DONT_EXISTS));

    expect(markWebCardAsDeleted).not.toHaveBeenCalled();
    expect(removeProfile).not.toHaveBeenCalled();
  });

  test('should not invalidate the web card if the user is not the owner', async () => {
    mockUser('user-3');
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-456');
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue(
      mockProfileUser,
    );
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    await quitWebCard(
      {},
      { webCardId: 'global-webcard-456' },
      mockContext,
      mockInfo,
    );

    expect(invalidateWebCard).not.toHaveBeenCalled();
  });
});
