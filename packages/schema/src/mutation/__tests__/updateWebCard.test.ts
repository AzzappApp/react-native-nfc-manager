import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { getSessionInfos } from '#GraphQLContext';
import { profileByWebCardIdAndUserIdLoader, webCardLoader } from '#loaders';
import { isUserNameAvailable } from '#helpers/webCardHelpers';
import updateWebCardMutation from '../updateWebCard';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  updateWebCard: jest.fn(),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardLoader: {
    load: jest.fn(),
    clear: jest.fn(),
  },
  webCardCategoryLoader: {
    load: jest.fn(),
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

jest.mock('@azzapp/shared/profileHelpers', () => ({
  profileHasAdminRight: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#externals', () => ({
  invalidateWebCard: jest.fn(),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('updateWebCardMutation', () => {
  const mockWebCard = {
    id: 'webcard-123',
    userName: 'oldUser',
    companyActivityId: 'activity-001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw INVALID_REQUEST if web card is not found', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });

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
    (isValidUserName as jest.Mock).mockReturnValue(false);
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });

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
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });

    await expect(
      updateWebCardMutation(
        {},
        { webCardId: 'global-webcard-123', input: { userName: 'takenUser' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.USERNAME_ALREADY_EXISTS));
  });

  test('should throw UNAUTHORIZED if user is invited and tries to update company activity', async () => {
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (profileByWebCardIdAndUserIdLoader.load as jest.Mock).mockResolvedValue({
      invited: true,
    });
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-1' });

    await expect(
      updateWebCardMutation(
        {},
        {
          webCardId: 'global-webcard-123',
          input: { companyActivityId: 'activity-002' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });
});
