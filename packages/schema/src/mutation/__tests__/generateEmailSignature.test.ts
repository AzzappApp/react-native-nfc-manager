import { GraphQLError } from 'graphql';
import { getUserById, getProfileWithWebCardById } from '@azzapp/data';
import { sendTemplateEmail } from '@azzapp/shared/emailHelpers';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignEmailSignature from '@azzapp/shared/serializeAndSignEmailSignature';
import { getSessionInfos } from '#GraphQLContext';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import generateEmailSignature from '../generateEmailSignature';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getUserById: jest.fn(),
  getProfileWithWebCardById: jest.fn(),
}));

jest.mock('@azzapp/service/mediaServices', () => ({
  buildAvatarUrl: jest.fn().mockResolvedValue('https://avatar-url.com'),
}));

jest.mock('@azzapp/shared/emailHelpers', () => ({
  sendTemplateEmail: jest.fn(),
}));

jest.mock('@azzapp/shared/serializeAndSignContactCard', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    data: 'contactCardData',
    signature: 'contactCardSignature',
  }),
}));

jest.mock('@azzapp/shared/serializeAndSignEmailSignature', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    data: 'emailSignatureData',
    signature: 'emailSignatureSignature',
  }),
}));

jest.mock('@azzapp/shared/urlHelpers', () => ({
  buildEmailSignatureGenerationUrl: jest
    .fn()
    .mockReturnValue('https://azzapp.com/email-signature'),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
}));

jest.mock('graphql-relay', () => ({
  fromGlobalId: jest.fn().mockImplementation(id => ({
    id: id.replace('gql-', ''),
    type: id.split('-')[1],
  })),
}));

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

// Mock context and info
const mockContext: any = { intl: { formatMessage: jest.fn() } };
const mockInfo: any = {};

describe('generateEmailSignature Mutation', () => {
  const mockUser = {
    id: 'user-456',
    email: 'user@example.com',
  };

  const mockProfile = {
    id: 'profile-123',
    contactCard: {
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockWebCard = {
    id: 'webcard-789',
    userName: 'testUser',
    isMultiUser: false,
    commonInformation: {
      phoneNumbers: [],
      emails: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw UNAUTHORIZED if user is not authenticated', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: null });

    await expect(
      generateEmailSignature(
        {},
        {
          profileId: 'gql-Profile-123',
          config: { preview: 'base64-image-data' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should validate subscription before generating email signature', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: mockProfile,
      webCard: mockWebCard,
    });

    await generateEmailSignature(
      {},
      {
        profileId: 'gql-Profile-123',
        config: { preview: 'base64-image-data' },
      },
      mockContext,
      mockInfo,
    );

    expect(validateCurrentSubscription).toHaveBeenCalledWith('user-456', {
      action: 'GENERATE_EMAIL_SIGNATURE',
      webCardIsMultiUser: false,
    });
  });

  test('should call serializeAndSignEmailSignature without commonInformations if webcard is not multi user', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: mockProfile,
      webCard: { ...mockWebCard, isMultiUser: false },
    });

    await generateEmailSignature(
      {},
      {
        profileId: 'gql-Profile-123',
        config: { preview: 'base64-image-data' },
      },
      mockContext,
      mockInfo,
    );

    expect(serializeAndSignEmailSignature).toHaveBeenCalledWith(
      'testUser',
      'Profile-123',
      'webcard-789',
      { firstName: 'John', lastName: 'Doe' },
      undefined,
      'https://avatar-url.com',
    );
  });

  test('should call serializeAndSignEmailSignature with commonInformations if webcard is multi user', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: mockProfile,
      webCard: { ...mockWebCard, isMultiUser: true },
    });

    await generateEmailSignature(
      {},
      {
        profileId: 'gql-Profile-123',
        config: { preview: 'base64-image-data' },
      },
      mockContext,
      mockInfo,
    );

    expect(serializeAndSignEmailSignature).toHaveBeenCalledWith(
      'testUser',
      'Profile-123',
      'webcard-789',
      { firstName: 'John', lastName: 'Doe' },
      { emails: [], phoneNumbers: [] },
      'https://avatar-url.com',
    );
  });

  test('should throw INVALID_REQUEST if profile does not exist', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue(null);

    await expect(
      generateEmailSignature(
        {},
        {
          profileId: 'gql-Profile-123',
          config: { preview: 'base64-image-data' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_REQUEST if profile has no contactCard or webCard username', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: { ...mockProfile, contactCard: null },
      webCard: mockWebCard,
    });

    await expect(
      generateEmailSignature(
        {},
        {
          profileId: 'gql-Profile-123',
          config: { preview: 'base64-image-data' },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should return the correct email signature URL', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: mockProfile,
      webCard: mockWebCard,
    });

    const result = await generateEmailSignature(
      {},
      {
        profileId: 'gql-Profile-123',
        config: { preview: 'base64-image-data' },
      },
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      url: 'https://azzapp.com/email-signature',
    });
  });

  test('should send email with the correct parameters', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: mockProfile,
      webCard: mockWebCard,
    });
    (getUserById as jest.Mock).mockResolvedValue(mockUser);

    await generateEmailSignature(
      {},
      {
        profileId: 'gql-Profile-123',
        config: { preview: 'base64-image-data' },
      },
      mockContext,
      mockInfo,
    );

    expect(sendTemplateEmail).toHaveBeenCalled();
  });

  test('should not send email if user email is not found', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: mockProfile,
      webCard: mockWebCard,
    });
    (getUserById as jest.Mock).mockResolvedValue(null);

    await generateEmailSignature(
      {},
      {
        profileId: 'gql-Profile-123',
        config: { preview: 'base64-image-data' },
      },
      mockContext,
      mockInfo,
    );

    expect(sendTemplateEmail).not.toHaveBeenCalled();
  });
});
