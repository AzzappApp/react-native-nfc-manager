import {
  countWebCardProfiles,
  countDeletedWebCardProfiles,
  getWebCardPendingOwnerProfile,
} from '@azzapp/data';
import { getSessionInfos } from '#GraphQLContext';
import { hasWebCardProfileRight } from '#helpers/permissionsHelpers';
import { WebCard } from '../WebCardResolvers'; // Adjust path if needed
import type { WebCard as WebCardModel } from '@azzapp/data';

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
  externalFunction: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardOwnerLoader: {
    load: jest.fn(),
  },
  activeSubscriptionsForUserLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  hasWebCardProfileRight: jest.fn(),
}));

jest.mock('@azzapp/data', () => ({
  countWebCardProfiles: jest.fn(),
  countDeletedWebCardProfiles: jest.fn(),
  getWebCardPendingOwnerProfile: jest.fn(),
  getLastSubscription: jest.fn(),
}));

describe('WebCard Resolvers (with checks)', () => {
  const mockWebCard: WebCardModel = {
    id: 'webcard-123',
    alreadyPublished: true,
    cardIsPrivate: false,
    isMultiUser: true,
    lastUserNameUpdate: new Date(),
    userName: null,
    webCardKind: 'personal',
    firstName: null,
    lastName: null,
    logoId: null,
    commonInformation: null,
    companyName: null,

    locale: null,
    cardColors: null,
    cardStyle: null,
    cardIsPublished: false,

    coverId: '',
    coverMediaId: null,
    coverTexts: null,
    coverBackgroundColor: null,
    coverDynamicLinks: {
      links: [],
      color: '',
      size: 0,
      position: {
        x: 0,
        y: 0,
      },
      rotation: 0,
      shadow: false,
    },
    coverIsPredefined: false,
    coverIsLogoPredefined: false,
    coverPreviewPositionPercentage: null,
    companyActivityLabel: null,
    nbFollowers: 0,
    nbFollowings: 0,
    nbPosts: 0,
    nbPostsLiked: 0,
    nbLikes: 0,
    nbWebCardViews: 0,
    starred: false,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockContext = {} as any;
  const mockInfo = {} as any;

  test('should return correct value for alreadyPublished if user has access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(true);

    const result = await WebCard.alreadyPublished?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(true);
  });

  test('should return false for alreadyPublished if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);

    const result = await WebCard.alreadyPublished?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(false);
  });

  test('should return correct value for cardIsPrivate if user has access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(true);

    const result = await WebCard.cardIsPrivate?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(false);
  });

  test('should return null for cardIsPrivate if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);
    (getSessionInfos as jest.Mock).mockResolvedValue({ userId: 'test' });

    const result = await WebCard.cardIsPrivate?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(false);
  });

  test('should return correct value for isMultiUser if user has access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(true);

    const result = await WebCard.isMultiUser?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(true);
  });

  test('should return false for isMultiUser if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);

    const result = await WebCard.isMultiUser?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(false);
  });

  test('should return correct number of profiles if user has access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(true);
    (countWebCardProfiles as jest.Mock).mockResolvedValue(5);

    const result = await WebCard.nbProfiles?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(5);
  });

  test('should return 1 for nbProfiles if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);

    const result = await WebCard.nbProfiles?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(1);
  });

  test('should return correct number of deleted profiles if user has access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(true);
    (countDeletedWebCardProfiles as jest.Mock).mockResolvedValue(2);

    const result = await WebCard.nbDeletedProfiles?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(2);
  });

  test('should return 1 for nbDeletedProfiles if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);

    const result = await WebCard.nbDeletedProfiles?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBe(1);
  });

  test('should return pending owner profile if user has access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(true);
    (getWebCardPendingOwnerProfile as jest.Mock).mockResolvedValue({
      id: 'owner-456',
    });

    const result = await WebCard.profilePendingOwner?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toEqual({ id: 'owner-456' });
  });

  test('should return null for profilePendingOwner if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);

    const result = await WebCard.profilePendingOwner?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBeNull();
  });

  test('should return null for subscription if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);

    const result = await WebCard.subscription?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBeNull();
  });

  test('should return next allowed username change date if user has access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(true);
    const lastUpdateDate = new Date();
    mockWebCard.lastUserNameUpdate = lastUpdateDate;

    const expectedDate = new Date(lastUpdateDate);
    expectedDate.setDate(expectedDate.getDate() + 1);

    const result = await WebCard.nextChangeUsernameAllowedAt?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toEqual(expectedDate);
  });

  test('should return null for nextChangeUsernameAllowedAt if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);

    const result = await WebCard.nextChangeUsernameAllowedAt?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toBeNull();
  });

  test('should return correct updatedAt value if user has access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(true);
    mockWebCard.updatedAt = new Date('2024-01-01T12:00:00Z');

    const result = await WebCard.updatedAt?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toEqual('2024-01-01T12:00:00.000Z');
  });

  test('should return current timestamp for updatedAt if user lacks access', async () => {
    (hasWebCardProfileRight as jest.Mock).mockResolvedValue(false);

    const result = await WebCard.updatedAt?.(
      mockWebCard,
      {},
      mockContext,
      mockInfo,
    );
    expect(result).toEqual(expect.any(String)); // Should be a valid timestamp
  });
});
