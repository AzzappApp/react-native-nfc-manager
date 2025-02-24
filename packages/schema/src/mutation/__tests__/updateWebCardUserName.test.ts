import { GraphQLError } from 'graphql';
import {
  updateWebCard,
  transaction,
  createRedirectWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { isUserNameAvailable } from '#helpers/webCardHelpers';
import updateWebCardUserNameMutation from '../updateWebCardUserName';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  updateWebCard: jest.fn(),
  transaction: jest.fn(callback => callback()),
  createRedirectWebCard: jest.fn(),
  deleteRedirectionFromTo: jest.fn(),
}));

jest.mock('#externals', () => ({
  invalidateWebCard: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileAdminRight: jest.fn(),
}));

jest.mock('#helpers/webCardHelpers', () => ({
  isUserNameAvailable: jest.fn(),
}));

jest.mock('@azzapp/shared/stringHelpers', () => ({
  isValidUserName: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

// Mock `fromGlobalIdWithType`
(fromGlobalIdWithType as jest.Mock).mockImplementation(
  (id: string, type: string) => {
    if (!id.startsWith('global-')) {
      throw new Error(`Invalid ID format for type ${type}`);
    }
    return id.replace('global-', '');
  },
);

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('updateWebCardUserNameMutation', () => {
  const mockWebCard = {
    id: 'webcard-123',
    userName: 'oldUser',
    alreadyPublished: true,
    lastUserNameUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.USERNAME_CHANGE_FREQUENCY_DAY = '1';
    process.env.USERNAME_REDIRECTION_AVAILABILITY_DAY = '2';
  });

  test('should successfully update a username', async () => {
    (isValidUserName as jest.Mock).mockReturnValue(true);
    (isUserNameAvailable as jest.Mock).mockResolvedValue({ available: true });
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    const result = await updateWebCardUserNameMutation(
      {},
      { webCardId: 'global-webcard-123', input: { userName: 'newUser' } },
      mockContext,
      mockInfo,
    );

    expect(checkWebCardProfileAdminRight).toHaveBeenCalledWith('webcard-123');
    expect(isValidUserName).toHaveBeenCalledWith('newUser');
    expect(isUserNameAvailable).toHaveBeenCalledWith('newUser');
    expect(updateWebCard).toHaveBeenCalledWith(
      'webcard-123',
      expect.any(Object),
    );
    expect(result).toHaveProperty('webCard.userName', 'newUser');
    expect(invalidateWebCard).toHaveBeenCalledWith('newUser');
  });

  test('should throw INVALID_WEBCARD_USERNAME for invalid username', async () => {
    (isValidUserName as jest.Mock).mockReturnValue(false);

    await expect(
      updateWebCardUserNameMutation(
        {},
        {
          webCardId: 'global-webcard-123',
          input: { userName: 'Invalid@Name' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_WEBCARD_USERNAME));
  });

  test('should throw USERNAME_ALREADY_EXISTS if username is taken', async () => {
    (isValidUserName as jest.Mock).mockReturnValue(true);
    (isUserNameAvailable as jest.Mock).mockResolvedValue({ available: false });

    await expect(
      updateWebCardUserNameMutation(
        {},
        { webCardId: 'global-webcard-123', input: { userName: 'takenUser' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.USERNAME_ALREADY_EXISTS));
  });

  test('should throw INVALID_REQUEST if the web card is not found', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      updateWebCardUserNameMutation(
        {},
        { webCardId: 'global-webcard-123', input: { userName: 'validUser' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw USERNAME_CHANGE_NOT_ALLOWED_DELAY if username was changed too recently', async () => {
    const recentWebCard = { ...mockWebCard, lastUserNameUpdate: new Date() };
    (webCardLoader.load as jest.Mock).mockResolvedValue(recentWebCard);
    (isUserNameAvailable as jest.Mock).mockResolvedValue({ available: true });

    await expect(
      updateWebCardUserNameMutation(
        {},
        { webCardId: 'global-webcard-123', input: { userName: 'newUser' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(
      new GraphQLError(ERRORS.USERNAME_CHANGE_NOT_ALLOWED_DELAY),
    );
  });

  test('should throw INVALID_REQUEST if new username is the same as the old one', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    await expect(
      updateWebCardUserNameMutation(
        {},
        { webCardId: 'global-webcard-123', input: { userName: 'oldUser' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should create a redirection when username is changed', async () => {
    (isValidUserName as jest.Mock).mockReturnValue(true);
    (isUserNameAvailable as jest.Mock).mockResolvedValue({ available: true });
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    await updateWebCardUserNameMutation(
      {},
      { webCardId: 'global-webcard-123', input: { userName: 'newUser' } },
      mockContext,
      mockInfo,
    );

    expect(createRedirectWebCard).toHaveBeenCalledWith({
      fromUserName: 'oldUser',
      toUserName: 'newUser',
      expiresAt: expect.any(Date),
    });
  });

  test('should throw INTERNAL_SERVER_ERROR if transaction fails', async () => {
    (isValidUserName as jest.Mock).mockReturnValue(true);
    (isUserNameAvailable as jest.Mock).mockResolvedValue({ available: true });
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (transaction as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(
      updateWebCardUserNameMutation(
        {},
        { webCardId: 'global-webcard-123', input: { userName: 'newUser' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));
  });
});
