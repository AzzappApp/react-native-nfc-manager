import { GraphQLError } from 'graphql';
import { markPostAsDeleted } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidatePost, invalidateWebCard } from '#externals';
import { postLoader, webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import deletePostMutation from '../deletePost';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  markPostAsDeleted: jest.fn(),
}));

jest.mock('#externals', () => ({
  invalidatePost: jest.fn(),
  invalidateWebCard: jest.fn(),
}));

jest.mock('#loaders', () => ({
  postLoader: {
    load: jest.fn(),
  },
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileEditorRight: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

const mockContext: any = {};

const mockInfo: any = {};

describe('deletePostMutation', () => {
  const mockPost = {
    id: 'post-123',
    webCardId: 'webcard-456',
  };

  const mockWebCard = {
    id: 'webcard-456',
    userName: 'testUser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser('user-1');
  });

  test('should delete a post successfully', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('post-123');
    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (markPostAsDeleted as jest.Mock).mockResolvedValue(undefined);

    const result = await deletePostMutation(
      {},
      { postId: 'post-123', webCardId: 'webcard-456' },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalIdWithType).toHaveBeenCalledWith('post-123', 'Post');
    expect(postLoader.load).toHaveBeenCalledWith('post-123');
    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(checkWebCardProfileEditorRight).toHaveBeenCalledWith('webcard-456');
    expect(markPostAsDeleted).toHaveBeenCalledWith('post-123', 'user-1');

    expect(invalidatePost).toHaveBeenCalledWith('testUser', 'post-123');
    expect(invalidateWebCard).toHaveBeenCalledWith('testUser');

    expect(result).toEqual({ postId: 'post-123' });
  });

  test('should throw an error if user is not authenticated', async () => {
    mockUser();

    await expect(
      deletePostMutation(
        {},
        { postId: 'post-123', webCardId: 'webCard-456' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(postLoader.load).not.toHaveBeenCalled();
    expect(markPostAsDeleted).not.toHaveBeenCalled();
  });

  test('should throw an error if post does not exist', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('post-123');
    (postLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      deletePostMutation(
        {},
        { postId: 'post-123', webCardId: 'webCard-456' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(postLoader.load).toHaveBeenCalledWith('post-123');
    expect(markPostAsDeleted).not.toHaveBeenCalled();
  });

  test('should throw an error if webCard does not exist', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('post-123');
    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      deletePostMutation(
        {},
        { postId: 'post-123', webCardId: 'webCard-456' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(markPostAsDeleted).not.toHaveBeenCalled();
  });

  test('should throw an error if markPostAsDeleted fails', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('post-123');
    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (markPostAsDeleted as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(
      deletePostMutation(
        {},
        { postId: 'post-123', webCardId: '' },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));

    expect(markPostAsDeleted).toHaveBeenCalledWith('post-123', 'user-1');
  });
});
