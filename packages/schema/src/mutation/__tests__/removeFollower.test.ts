import { GraphQLError } from 'graphql';
import { getWebCardById, unfollows } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import removeFollowerMutation from '../removeFollower';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getWebCardById: jest.fn(),
  unfollows: jest.fn(),
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileEditorRight: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

const mockContext: any = {};

const mockInfo: any = {};

describe('removeFollowerMutation', () => {
  const mockWebCard = {
    id: 'webcard-123',
    cardIsPrivate: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully remove a follower', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-123') // webCardId
      .mockReturnValueOnce('follower-456'); // removedFollowerId

    (getWebCardById as jest.Mock).mockResolvedValue(mockWebCard);
    (unfollows as jest.Mock).mockResolvedValue(undefined);

    const result = await removeFollowerMutation(
      {},
      {
        webCardId: 'global-webcard-123',
        input: { removedFollowerId: 'global-follower-456' },
      },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalIdWithType).toHaveBeenCalledWith(
      'global-webcard-123',
      'WebCard',
    );
    expect(fromGlobalIdWithType).toHaveBeenCalledWith(
      'global-follower-456',
      'WebCard',
    );
    expect(checkWebCardProfileEditorRight).toHaveBeenCalledWith('webcard-123');
    expect(getWebCardById).toHaveBeenCalledWith('webcard-123');
    expect(unfollows).toHaveBeenCalledWith('follower-456', 'webcard-123');

    expect(result).toEqual({ removedFollowerId: 'follower-456' });
  });

  test('should throw FORBIDDEN error if webCard is not private', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-123')
      .mockReturnValueOnce('follower-456');

    (getWebCardById as jest.Mock).mockResolvedValue({
      id: 'webcard-123',
      cardIsPrivate: false,
    });

    await expect(
      removeFollowerMutation(
        {},
        {
          webCardId: 'global-webcard-123',
          input: { removedFollowerId: 'global-follower-456' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.FORBIDDEN));

    expect(getWebCardById).toHaveBeenCalledWith('webcard-123');
    expect(unfollows).not.toHaveBeenCalled();
  });

  test('should throw INTERNAL_SERVER_ERROR if unfollows fails', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-123')
      .mockReturnValueOnce('follower-456');

    (getWebCardById as jest.Mock).mockResolvedValue(mockWebCard);
    (unfollows as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(
      removeFollowerMutation(
        {},
        {
          webCardId: 'global-webcard-123',
          input: { removedFollowerId: 'global-follower-456' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));

    expect(unfollows).toHaveBeenCalledWith('follower-456', 'webcard-123');
  });

  test('should throw error if checkWebCardProfileEditorRight is not allowed', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-123')
      .mockReturnValueOnce('follower-456');

    (checkWebCardProfileEditorRight as jest.Mock).mockRejectedValue(
      new GraphQLError(ERRORS.UNAUTHORIZED),
    );

    await expect(
      removeFollowerMutation(
        {},
        {
          webCardId: 'global-webcard-123',
          input: { removedFollowerId: 'global-follower-456' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(getWebCardById).not.toHaveBeenCalled();
    expect(unfollows).not.toHaveBeenCalled();
  });
});
