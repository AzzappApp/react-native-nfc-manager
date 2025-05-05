import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { createReport, getReport } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { postLoader, webCardLoader } from '#loaders';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import sendReport from '../sendReport';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  createReport: jest.fn(),
  getReport: jest.fn(),
}));

jest.mock('#loaders', () => ({
  postLoader: {
    load: jest.fn(),
  },
  postCommentLoader: {
    load: jest.fn(),
  },
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('graphql-relay', () => ({
  fromGlobalId: jest.fn(id => ({
    id: id.replace('global-', ''),
    type: id.split('-')[1],
  })),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('sendReport', () => {
  const mockPost = {
    id: 'post-123',
    deleted: false,
  };

  const mockWebCard = {
    id: 'webcard-456',
    deleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser('user-1');
  });

  test('should successfully create a report for a Post', async () => {
    (fromGlobalId as jest.Mock).mockReturnValue({
      id: 'post-123',
      type: 'Post',
    });
    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (createReport as jest.Mock).mockResolvedValue(undefined);

    const result = await sendReport(
      {},
      { id: 'global-post-123' },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalId).toHaveBeenCalledWith('global-post-123');
    expect(postLoader.load).toHaveBeenCalledWith('post-123');
    expect(createReport).toHaveBeenCalledWith({
      targetId: 'post-123',
      targetType: 'post',
      userId: 'user-1',
    });

    expect(result).toEqual({
      created: true,
      report: {
        targetId: 'post-123',
        targetType: 'post',
        userId: 'user-1',
      },
    });
  });

  test('should throw UNAUTHORIZED if user is not authenticated', async () => {
    mockUser();

    await expect(
      sendReport({}, { id: 'global-post-123' }, mockContext, mockInfo),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(createReport).not.toHaveBeenCalled();
  });

  test('should throw INVALID_REQUEST if target type is unknown', async () => {
    (fromGlobalId as jest.Mock).mockReturnValue({
      id: 'unknown-123',
      type: 'UnknownType',
    });

    await expect(
      sendReport({}, { id: 'global-unknown-123' }, mockContext, mockInfo),
    ).rejects.toThrow('Invalid type');
  });

  test('should return false if a report already exists', async () => {
    const existingReport = {
      targetId: 'post-123',
      targetType: 'post',
      userId: 'user-1',
    };

    (fromGlobalId as jest.Mock).mockReturnValue({
      id: 'post-123',
      type: 'Post',
    });
    (postLoader.load as jest.Mock).mockRejectedValue(new Error('DB error'));
    (getReport as jest.Mock).mockResolvedValue(existingReport);

    const result = await sendReport(
      {},
      { id: 'global-post-123' },
      mockContext,
      mockInfo,
    );

    expect(getReport).toHaveBeenCalledWith('post-123', 'user-1', 'post');
    expect(result).toEqual({
      created: false,
      report: existingReport,
    });
  });

  test('should handle deleted targets properly', async () => {
    const deletedPost = {
      id: 'post-123',
      deleted: true,
      deletedBy: 'admin-1',
    };

    (fromGlobalId as jest.Mock).mockReturnValue({
      id: 'post-123',
      type: 'Post',
    });
    (postLoader.load as jest.Mock).mockResolvedValue(deletedPost);
    (createReport as jest.Mock).mockResolvedValue(undefined);

    const result = await sendReport(
      {},
      { id: 'global-post-123' },
      mockContext,
      mockInfo,
    );

    expect(createReport).toHaveBeenCalledWith({
      targetId: 'post-123',
      targetType: 'post',
      userId: 'user-1',
      treatedBy: 'admin-1',
      createdAt: expect.any(Date),
      treatedAt: expect.any(Date),
    });

    expect(result).toEqual({
      created: true,
      report: {
        targetId: 'post-123',
        targetType: 'post',
        userId: 'user-1',
      },
    });
  });

  test('should throw an error if createReport fails and no report exists', async () => {
    (fromGlobalId as jest.Mock).mockReturnValue({
      id: 'post-123',
      type: 'Post',
    });
    (postLoader.load as jest.Mock).mockResolvedValue(mockPost);
    (createReport as jest.Mock).mockRejectedValue(new Error('DB Error'));
    (getReport as jest.Mock).mockResolvedValue(null);

    await expect(
      sendReport({}, { id: 'global-post-123' }, mockContext, mockInfo),
    ).rejects.toThrow('DB Error');
  });

  test('should create a report for a WebCard', async () => {
    (fromGlobalId as jest.Mock).mockReturnValue({
      id: 'webcard-456',
      type: 'WebCard',
    });
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (createReport as jest.Mock).mockResolvedValue(undefined);

    const result = await sendReport(
      {},
      { id: 'global-webcard-456' },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalId).toHaveBeenCalledWith('global-webcard-456');
    expect(webCardLoader.load).toHaveBeenCalledWith('webcard-456');
    expect(createReport).toHaveBeenCalledWith({
      targetId: 'webcard-456',
      targetType: 'webCard',
      userId: 'user-1',
    });

    expect(result).toEqual({
      created: true,
      report: {
        targetId: 'webcard-456',
        targetType: 'webCard',
        userId: 'user-1',
      },
    });
  });
});
