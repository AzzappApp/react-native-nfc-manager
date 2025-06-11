import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { profileByWebCardIdAndUserIdLoader, webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import { isUserNameAvailable } from '#helpers/webCardHelpers';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import updateWebCardMutation from '../updateWebCard';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  updateWebCard: jest.fn(),
  transaction: jest.fn(callback => callback()),
}));

jest.mock('#loaders', () => ({
  webCardLoader: {
    load: jest.fn(),
    clear: jest.fn(),
  },
  profileByWebCardIdAndUserIdLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileEditorRight: jest.fn(),
}));

jest.mock('#helpers/subscriptionHelpers', () => ({
  checkWebCardHasSubscription: jest.fn(),
}));

jest.mock('#helpers/webCardHelpers', () => ({
  isUserNameAvailable: jest.fn(),
}));

jest.mock('@azzapp/shared/stringHelpers', () => ({
  isValidUserName: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#externals', () => ({
  invalidateWebCard: jest.fn(),
  notifyWebCardUsers: jest.fn(),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('updateWebCardMutation', () => {
  const mockWebCard = {
    id: 'webcard-123',
    userName: 'oldUser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser('user-1');
  });

  test('should throw INVALID_REQUEST if web card is not found', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      updateWebCardMutation(
        {},
        { webCardId: 'global-webcard-123', input: {} },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_WEBCARD_USERNAME if username is invalid', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue({
      ...mockWebCard,
      userName: null,
    });
    (checkWebCardProfileEditorRight as jest.Mock).mockResolvedValue({
      invited: false,
      profileRole: 'admin',
    });
    (isValidUserName as jest.Mock).mockReturnValue(false);
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValueOnce(
      {
        invited: false,
        profileRole: 'admin',
      },
    );

    await expect(
      updateWebCardMutation(
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
    (webCardLoader.load as jest.Mock).mockResolvedValue({
      ...mockWebCard,
      userName: null,
    });
    (isValidUserName as jest.Mock).mockReturnValue(true);
    (isUserNameAvailable as jest.Mock).mockResolvedValue({ available: false });
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValueOnce(
      {
        invited: false,
        profileRole: 'admin',
      },
    );

    await expect(
      updateWebCardMutation(
        {},
        { webCardId: 'global-webcard-123', input: { userName: 'takenUser' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.USERNAME_ALREADY_EXISTS));
  });

  test('should update successfully and return webCard and profile', async () => {
    const updatedWebCard = { ...mockWebCard, userName: 'updatedName' };

    (webCardLoader.load as jest.Mock)
      .mockResolvedValueOnce(mockWebCard) // first load
      .mockResolvedValueOnce(updatedWebCard); // after update
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue({
      invited: false,
      profileRole: 'admin',
    });
    (isUserNameAvailable as jest.Mock).mockResolvedValue({ available: true });

    const result = await updateWebCardMutation(
      {},
      { webCardId: 'global-webcard-123', input: { userName: 'updatedName' } },
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      webCard: updatedWebCard,
      profile: {
        invited: false,
        profileRole: 'admin',
      },
    });
  });
});
