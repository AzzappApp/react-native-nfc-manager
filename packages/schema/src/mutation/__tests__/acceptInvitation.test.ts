import { GraphQLError } from 'graphql';
import { updateProfile } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { profileLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import acceptInvitationMutation from '../acceptInvitation';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  updateProfile: jest.fn(),
}));

jest.mock('#loaders', () => ({
  profileLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

const mockContext: any = {};

const info: any = {};

describe('acceptInvitationMutation', () => {
  const mockProfile = {
    id: '123',
    createdAt: '2024-01-01T00:00:00Z',
    invited: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should accept an invitation and return the updated profile', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (updateProfile as jest.Mock).mockResolvedValue(undefined);

    const result = await acceptInvitationMutation(
      {},
      { profileId: 'profile-123' },
      mockContext,
      info,
    );

    expect(fromGlobalIdWithType).toHaveBeenCalledWith('profile-123', 'Profile');
    expect(profileLoader.load).toHaveBeenCalledWith('123');
    expect(updateProfile).toHaveBeenCalledWith('123', {
      invited: false,
      lastContactCardUpdate: mockProfile.createdAt,
    });

    expect(result).toEqual({
      profile: {
        ...mockProfile,
        invited: false,
      },
    });
  });

  test('should throw an error if the profile is not found', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
    (profileLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      acceptInvitationMutation(
        {},
        { profileId: 'profile-123' },
        mockContext,
        info,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(profileLoader.load).toHaveBeenCalledWith('123');
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
