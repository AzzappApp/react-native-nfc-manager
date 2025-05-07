import { GraphQLError } from 'graphql';
import {
  getProfileByUserAndWebCard,
  getPublishedWebCardCount,
  getWebCardCountProfile,
  getWebCardPosts,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidatePost, invalidateWebCard } from '#externals';
import { webCardLoader, webCardOwnerLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import toggleWebCardPublished from '../toggleWebCardPublished';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getProfileByUserAndWebCard: jest.fn(),
  getPublishedWebCardCount: jest.fn(),
  getWebCardCountProfile: jest.fn(),
  getWebCardPosts: jest.fn(),
  updateWebCard: jest.fn(),
}));

jest.mock('#externals', () => ({
  invalidatePost: jest.fn(),
  invalidateWebCard: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardLoader: { load: jest.fn() },
  webCardOwnerLoader: { load: jest.fn() },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileAdminRight: jest.fn(),
}));

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

// Mock `fromGlobalIdWithType`
(fromGlobalIdWithType as jest.Mock).mockImplementation(
  (id: string, type: string) => {
    if (!id.startsWith('gql-')) {
      throw new Error(`Invalid ID format for type ${type}`);
    }
    return id.replace('gql-', '');
  },
);

const mockContext: any = {};
const mockInfo: any = {};

describe('toggleWebCardPublished Mutation', () => {
  const mockWebCard = {
    id: 'webcard-1',
    userName: 'testUser',
    isMultiUser: false,
    webCardKind: 'business',
    coverMediaId: 'cover-1',
    cardIsPublished: false,
    alreadyPublished: false,
  };

  const mockOwner = { id: 'owner-1' };
  const mockProfile = {
    id: 'profile-1',
    contactCard: {
      company: 'Azzapp',
      urls: ['https://azzapp.com'],
    },
    logoId: 'logo-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser('user-1');
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (webCardOwnerLoader.load as jest.Mock).mockResolvedValue(mockOwner);
    (getProfileByUserAndWebCard as jest.Mock).mockResolvedValue(mockProfile);
    (getPublishedWebCardCount as jest.Mock).mockResolvedValue(1);
    (getWebCardCountProfile as jest.Mock).mockResolvedValue(2);
  });

  test('should throw INVALID_REQUEST if user is not authenticated', async () => {
    mockUser();
    await expect(
      toggleWebCardPublished(
        {},
        { webCardId: 'gql-webcard-1', input: { published: true } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_REQUEST if webCard is not found', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      toggleWebCardPublished(
        {},
        { webCardId: 'gql-webcard-1', input: { published: true } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw MISSING_COVER if publishing a webCard without a cover', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue({
      ...mockWebCard,
      coverMediaId: null,
    });

    await expect(
      toggleWebCardPublished(
        {},
        { webCardId: 'gql-webcard-1', input: { published: true } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.MISSING_COVER));
  });

  test('should call validateCurrentSubscription for multi-user webCard', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue({
      ...mockWebCard,
      isMultiUser: true,
    });

    (getWebCardPosts as jest.Mock).mockResolvedValue([]);

    await toggleWebCardPublished(
      {},
      { webCardId: 'gql-webcard-1', input: { published: true } },
      mockContext,
      mockInfo,
    );

    expect(validateCurrentSubscription).toHaveBeenCalledWith(
      'owner-1',
      {
        webCardIsPublished: true,
        action: 'UPDATE_WEBCARD_PUBLICATION',
        webCardIsMultiUser: true,
        webCardKind: 'business',
        alreadyPublished: 1,
        addedSeats: 2,
        ownerContactCardHasCompanyName: true,
        ownerContactCardHasUrl: true,
        ownerContactCardHasLogo: true,
      },
      mockContext.apiEndpoint,
    );
  });

  test('should update webCard and invalidate cache on publish', async () => {
    (getWebCardPosts as jest.Mock).mockResolvedValue([
      { id: 'post-1' },
      { id: 'post-2' },
    ]);

    const result = await toggleWebCardPublished(
      {},
      { webCardId: 'gql-webcard-1', input: { published: true } },
      mockContext,
      mockInfo,
    );

    expect(updateWebCard).toHaveBeenCalledWith(
      'webcard-1',
      expect.objectContaining({
        cardIsPublished: true,
        alreadyPublished: true,
      }),
    );
    expect(invalidateWebCard).toHaveBeenCalledWith('testUser');
    expect(invalidatePost).toHaveBeenCalledTimes(2);
    expect(invalidatePost).toHaveBeenCalledWith('testUser', 'post-1');
    expect(invalidatePost).toHaveBeenCalledWith('testUser', 'post-2');

    expect(result).toEqual({
      webCard: expect.objectContaining({
        cardIsPublished: true,
        alreadyPublished: true,
      }),
    });
  });

  test('should update webCard and invalidate cache on unpublish', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue({
      ...mockWebCard,
      cardIsPublished: true,
      alreadyPublished: true,
    });

    const result = await toggleWebCardPublished(
      {},
      { webCardId: 'gql-webcard-1', input: { published: false } },
      mockContext,
      mockInfo,
    );

    expect(updateWebCard).toHaveBeenCalledWith(
      'webcard-1',
      expect.objectContaining({
        cardIsPublished: false,
      }),
    );
    expect(invalidateWebCard).toHaveBeenCalledWith('testUser');
    expect(invalidatePost).toHaveBeenCalledTimes(2);

    expect(result).toEqual({
      webCard: expect.objectContaining({
        cardIsPublished: false,
      }),
    });
  });

  test('should handle updateWebCard failure gracefully', async () => {
    (updateWebCard as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(
      toggleWebCardPublished(
        {},
        { webCardId: 'gql-webcard-1', input: { published: true } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(updateWebCard).toHaveBeenCalledWith('webcard-1', expect.any(Object));
  });

  test('should not update webCard already publish', async () => {
    const resultWebCard = {
      ...mockWebCard,
      cardIsPublished: true,
    };
    (webCardLoader.load as jest.Mock).mockResolvedValue(resultWebCard);
    const result = await toggleWebCardPublished(
      {},
      { webCardId: 'gql-webcard-1', input: { published: true } },
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      webCard: resultWebCard,
    });
  });
});
