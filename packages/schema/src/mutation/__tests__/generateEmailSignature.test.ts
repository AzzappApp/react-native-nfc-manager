import { GraphQLError } from 'graphql';
import { getProfileWithWebCardById } from '@azzapp/data';
import { generateEmailSignature } from '@azzapp/service/emailSignatureServices';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import { generateEmailSignature as generateEmailSignatureMutation } from '../generateEmailSignature';
import type { GraphQLContext } from '#GraphQLContext';

// Mocks
jest.mock('@azzapp/data', () => ({
  getProfileWithWebCardById: jest.fn(),
}));

jest.mock('@azzapp/service/emailSignatureServices', () => ({
  generateEmailSignature: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

const mockContext = {
  intl: {
    formatMessage: ({ defaultMessage }: any) => defaultMessage,
  },
} as GraphQLContext;

const mockInfo = {} as any;

describe('generateEmailSignatureMutation', () => {
  const gqlProfileId = 'gql-profile-id';
  const profileId = 'real-profile-id';
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser(userId);
    (fromGlobalIdWithType as jest.Mock).mockReturnValue(profileId);
  });

  test('should throw UNAUTHORIZED if user is not logged in', async () => {
    mockUser();

    await expect(
      generateEmailSignatureMutation(
        {},
        { profileId: gqlProfileId, config: { preview: '' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should throw INVALID_REQUEST if no profile is found', async () => {
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue(null);

    await expect(
      generateEmailSignatureMutation(
        {},
        { profileId: gqlProfileId, config: { preview: '' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_REQUEST if profile has no contact card', async () => {
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: { userId, contactCard: null },
      webCard: { userName: 'test', isMultiUser: false },
    });

    await expect(
      generateEmailSignatureMutation(
        {},
        { profileId: gqlProfileId, config: { preview: '' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_REQUEST if webCard has no userName', async () => {
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: { userId, contactCard: { firstName: 'John' } },
      webCard: { userName: null, isMultiUser: false },
    });

    await expect(
      generateEmailSignatureMutation(
        {},
        { profileId: gqlProfileId, config: { preview: '' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw UNAUTHORIZED if user is not owner of the profile', async () => {
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: { userId: 'another-user', contactCard: { firstName: 'John' } },
      webCard: { userName: 'test', isMultiUser: false },
    });

    await expect(
      generateEmailSignatureMutation(
        {},
        { profileId: gqlProfileId, config: { preview: '' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should return url if everything is valid', async () => {
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: { userId, contactCard: { firstName: 'John' } },
      webCard: { userName: 'test', isMultiUser: false },
    });

    (generateEmailSignature as jest.Mock).mockResolvedValue(
      'https://signature.link',
    );

    const result = await generateEmailSignatureMutation(
      {},
      { profileId: gqlProfileId, config: { preview: 'testPreview' } },
      mockContext,
      mockInfo,
    );

    expect(validateCurrentSubscription).toHaveBeenCalledWith(
      userId,
      {
        action: 'GENERATE_EMAIL_SIGNATURE',
        webCardIsMultiUser: false,
      },
      mockContext.apiEndpoint,
    );

    expect(generateEmailSignature).toHaveBeenCalledWith({
      profile: expect.any(Object),
      webCard: expect.any(Object),
      intl: mockContext.intl,
    });

    expect(result).toEqual({ url: 'https://signature.link' });
  });
});
