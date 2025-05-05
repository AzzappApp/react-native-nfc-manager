import { GraphQLError } from 'graphql';
import {
  checkMedias,
  getWebCardById,
  referencesMedias,
  updateProfile,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { profileByWebCardIdAndUserIdLoader, profileLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import updateProfileMutation from '../updateProfile';

jest.mock('@azzapp/data', () => ({
  checkMedias: jest.fn(),
  getWebCardById: jest.fn(),
  referencesMedias: jest.fn(),
  transaction: jest.fn(fn => fn()),
  updateProfile: jest.fn(),
}));

jest.mock('#loaders', () => ({
  profileByWebCardIdAndUserIdLoader: { load: jest.fn() },
  profileLoader: { load: jest.fn() },
  webCardOwnerLoader: { load: jest.fn() },
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

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

describe('updateProfileMutation', () => {
  const mockInfo: any = {}; // Mock GraphQL resolve info
  const mockContext: any = {}; // Mock GraphQL context

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser('userId');
  });

  test('should throw PROFILE_DONT_EXISTS if profile does not exist', async () => {
    (profileLoader.load as jest.Mock).mockResolvedValue(null);
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('targetProfileId');

    await expect(
      updateProfileMutation(
        {},
        { profileId: 'mockProfileId', input: {} },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.PROFILE_DONT_EXISTS));
  });

  test('should throw UNAUTHORIZED if user has no profile for the webCard', async () => {
    (profileLoader.load as jest.Mock).mockResolvedValue({
      webCardId: 'webCardId',
    });
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue(
      null,
    );
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('targetProfileId');

    await expect(
      updateProfileMutation(
        {},
        { profileId: 'mockProfileId', input: {} },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should throw FORBIDDEN if user is not owner and tries to change role to owner', async () => {
    (profileLoader.load as jest.Mock).mockResolvedValue({
      webCardId: 'webCardId',
    });
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue({
      profileRole: 'admin',
    });

    (fromGlobalIdWithType as jest.Mock).mockReturnValue('targetProfileId');

    await expect(
      updateProfileMutation(
        {},
        { profileId: 'mockProfileId', input: { profileRole: 'owner' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.FORBIDDEN));
  });

  test('should throw FORBIDDEN if user has no admin rights to update another profile', async () => {
    (profileLoader.load as jest.Mock).mockResolvedValue({
      webCardId: 'webCardId',
    });
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue({
      id: 'currentProfileId',
      profileRole: 'user',
    });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('targetProfileId');

    await expect(
      updateProfileMutation(
        {},
        { profileId: 'mockProfileId', input: {} },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.FORBIDDEN));
  });

  test('should throw INVALID_REQUEST if user tries to change their own profile role', async () => {
    (profileLoader.load as jest.Mock).mockResolvedValue({
      webCardId: 'webCardId',
    });
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue({
      id: 'targetProfileId',
      profileRole: 'user',
    });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('targetProfileId');

    await expect(
      updateProfileMutation(
        {},
        { profileId: 'mockProfileId', input: { profileRole: 'admin' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should successfully update the profile', async () => {
    (profileLoader.load as jest.Mock).mockResolvedValue({
      webCardId: 'webCardId',
      avatarId: 'oldAvatar',
      logoId: 'oldLogo',
    });
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue({
      id: 'currentProfileId',
      profileRole: 'owner',
      userId: 'userId',
    });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('targetProfileId');
    (getWebCardById as jest.Mock).mockResolvedValue({ cardIsPublished: true });
    (validateCurrentSubscription as jest.Mock).mockResolvedValue(undefined);
    (checkMedias as jest.Mock).mockResolvedValue(undefined);
    (updateProfile as jest.Mock).mockResolvedValue(undefined);
    (referencesMedias as jest.Mock).mockResolvedValue(undefined);

    const result = await updateProfileMutation(
      {},
      {
        profileId: 'mockProfileId',
        input: { profileRole: 'admin', contactCard: { company: 'Azzapp' } },
      },
      mockContext,
      mockInfo,
    );

    expect(updateProfile).toHaveBeenCalledWith('targetProfileId', {
      profileRole: 'admin',
      contactCard: { company: 'Azzapp' },
      avatarId: undefined,
      logoId: undefined,
    });
    expect(referencesMedias).toHaveBeenCalledWith([], ['oldAvatar', 'oldLogo']);
    expect(result?.profile).toEqual({
      webCardId: 'webCardId',
      avatarId: 'oldAvatar',
      logoId: 'oldLogo',
      profileRole: 'admin',
      contactCard: { company: 'Azzapp' },
    });
  });
});
