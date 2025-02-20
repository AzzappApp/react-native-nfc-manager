import { GraphQLError } from 'graphql';
import { togglePostReaction } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { postLoader, webCardLoader } from '#loaders';
import {
  checkWebCardHasCover,
  checkWebCardProfileEditorRight,
} from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import togglePostReactionMutation from '../postReaction';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  togglePostReaction: jest.fn(),
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
  checkWebCardHasCover: jest.fn(),
  checkWebCardProfileEditorRight: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('togglePostReactionMutation', () => {
  const mockPost = {
    id: 'post-123',
    webCardId: 'webcard-456',
    deleted: false,
    allowLikes: true,
    counterReactions: 5,
  };

  const mockWebCard = {
    id: 'webcard-456',
    cardIsPublished: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully toggle a post reaction', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456') // webCardId
      .mockReturnValueOnce('post-123'); // postId

    (checkWebCardProfileEditorRight as jest.Mock).mockResolvedValue(undefined);
    (checkWebCardHasCover as jest.Mock).mockResolvedValue(undefined);
    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (togglePostReaction as jest.Mock).mockResolvedValue(true);

    const result = await togglePostReactionMutation(
      {},
      {
        webCardId: 'global-webcard-456',
        input: { postId: 'global-post-123', reactionKind: 'like' },
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
    expect(postLoader.load).toHaveBeenCalledWith('post-123');
    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(togglePostReaction).toHaveBeenCalledWith(
      'webcard-456',
      'post-123',
      'like',
    );

    expect(result).toEqual({
      post: {
        ...mockPost,
        counterReactions: 6,
      },
    });
  });

  test('should throw INVALID_REQUEST if post does not exist or is deleted', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (postLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      togglePostReactionMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', reactionKind: 'like' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(postLoader.load).toHaveBeenCalledWith('post-123');
    expect(togglePostReaction).not.toHaveBeenCalled();
  });

  test('should throw REACTION_NOT_ALLOWED if reaction type is not allowed', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (postLoader.load as jest.Mock).mockResolvedValue({
      ...mockPost,
      allowLikes: false,
    });

    await expect(
      togglePostReactionMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', reactionKind: 'like' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.REACTION_NOT_ALLOWED));

    expect(postLoader.load).toHaveBeenCalledWith('post-123');
    expect(togglePostReaction).not.toHaveBeenCalled();
  });

  test('should throw INVALID_REQUEST if webCard does not exist', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      togglePostReactionMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', reactionKind: 'like' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(togglePostReaction).not.toHaveBeenCalled();
  });

  test('should throw UNPUBLISHED_WEB_CARD if webCard is not published', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue({
      ...mockWebCard,
      cardIsPublished: false,
    });

    await expect(
      togglePostReactionMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', reactionKind: 'like' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNPUBLISHED_WEB_CARD));

    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(togglePostReaction).not.toHaveBeenCalled();
  });

  test('should throw INTERNAL_SERVER_ERROR if togglePostReaction fails', async () => {
    (fromGlobalIdWithType as jest.Mock)
      .mockReturnValueOnce('webcard-456')
      .mockReturnValueOnce('post-123');

    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (togglePostReaction as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(
      togglePostReactionMutation(
        {},
        {
          webCardId: 'global-webcard-456',
          input: { postId: 'global-post-123', reactionKind: 'like' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));

    expect(togglePostReaction).toHaveBeenCalledWith(
      'webcard-456',
      'post-123',
      'like',
    );
  });
});
