import { GraphQLError } from 'graphql';
import { getPostByIdWithMedia, createPostComment } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { webCardLoader } from '#loaders';
import {
  checkWebCardHasCover,
  checkWebCardProfileEditorRight,
} from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import createPostCommentMutation from '../createPostComment';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getPostByIdWithMedia: jest.fn(),
  createPostComment: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardHasCover: jest.fn(),
  checkWebCardProfileEditorRight: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('createPostCommentMutation', () => {
  const mockPost = {
    id: 'post-123',
    webCardId: 'webcard-456',
    allowComments: true,
  };

  const mockWebCard = {
    id: 'webcard-456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully create a post comment', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456') // webCardId
      .mockReturnValueOnce('post-123'); // postId

    (checkWebCardProfileEditorRight as jest.Mock).mockResolvedValue(undefined);
    (checkWebCardHasCover as jest.Mock).mockResolvedValue(undefined);
    (getPostByIdWithMedia as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (createPostComment as jest.Mock).mockResolvedValue('comment-789');

    const result = await createPostCommentMutation(
      {},
      {
        webCardId: 'global-webcard-456',
        input: { postId: 'global-post-123', comment: 'Nice post!' },
      },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalIdWithType).toHaveBeenCalledWith(
      'global-webcard-456',
      'WebCard',
    );
    expect(fromGlobalIdWithType).toHaveBeenCalledWith(
      'global-post-123',
      'Post',
    );
    expect(checkWebCardProfileEditorRight).toHaveBeenCalledWith('webcard-456');
    expect(checkWebCardHasCover).toHaveBeenCalledWith('webcard-456');
    expect(getPostByIdWithMedia).toHaveBeenCalledWith('post-123');
    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(createPostComment).toHaveBeenCalledWith({
      webCardId: 'webcard-456',
      postId: 'post-123',
      comment: 'Nice post!',
    });

    expect(result).toEqual({
      postComment: {
        id: 'comment-789',
        deleted: false,
        deletedBy: null,
        deletedAt: null,
        webCardId: 'webcard-456',
        postId: 'post-123',
        comment: 'Nice post!',
        createdAt: expect.any(Date),
      },
    });
  });

  test('should throw INVALID_REQUEST if post does not allow comments', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (getPostByIdWithMedia as jest.Mock).mockResolvedValue({
      ...mockPost,
      allowComments: false,
    });

    await expect(
      createPostCommentMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', comment: 'Nice post!' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(getPostByIdWithMedia).toHaveBeenCalledWith('post-123');
    expect(createPostComment).not.toHaveBeenCalled();
  });

  test('should throw INVALID_REQUEST if webCard is not found', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (getPostByIdWithMedia as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      createPostCommentMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', comment: 'Nice post!' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(createPostComment).not.toHaveBeenCalled();
  });

  test('should throw UNAUTHORIZED if checkWebCardProfileEditorRight fails', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (checkWebCardProfileEditorRight as jest.Mock).mockRejectedValue(
      new GraphQLError(ERRORS.UNAUTHORIZED),
    );

    await expect(
      createPostCommentMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', comment: 'Nice post!' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(getPostByIdWithMedia).not.toHaveBeenCalled();
    expect(createPostComment).not.toHaveBeenCalled();
  });

  test('should throw INTERNAL_SERVER_ERROR if createPostComment fails', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (getPostByIdWithMedia as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (createPostComment as jest.Mock).mockRejectedValue(new Error('DB Error'));
    (checkWebCardProfileEditorRight as jest.Mock).mockResolvedValue(undefined);

    await expect(
      createPostCommentMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', comment: 'Nice post!' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));

    expect(createPostComment).toHaveBeenCalledWith({
      webCardId: 'webcard-456',
      postId: 'post-123',
      comment: 'Nice post!',
    });
  });
});
