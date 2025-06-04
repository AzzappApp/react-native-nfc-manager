import { GraphQLError } from 'graphql';
import { getProfileWithWebCardById } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { sendEmailSignature } from '#externals';
import { getSessionUser } from '#GraphQLContext';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';

import { generateEmailSignatureWithKey } from '../generateEmailSignature';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getProfileWithWebCardById: jest.fn(),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionUser: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

jest.mock('#externals', () => ({
  sendEmailSignature: jest.fn(),
}));

const mockContext: any = { apiEndpoint: 'https://api.test' };
const mockInfo: any = {};

describe('generateEmailSignatureWithKey', () => {
  const input = {
    input: {
      profileId: 'global-profile-id',
      deviceId: 'device-xyz',
      key: 'signature-key',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return { done: true } when valid', async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('profile-id');
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: {
        id: 'profile-id',
        userId: 'user-1',
        contactCard: { some: 'data' },
      },
      webCard: {
        userName: 'demo',
        isMultiUser: false,
      },
    });

    const result = await generateEmailSignatureWithKey(
      {},
      input,
      mockContext,
      mockInfo,
    );
    expect(result).toEqual({ done: true });
    expect(sendEmailSignature).toHaveBeenCalledWith(
      'profile-id',
      'device-xyz',
      'signature-key',
    );
  });

  test('should throw UNAUTHORIZED if no user in session', async () => {
    (getSessionUser as jest.Mock).mockResolvedValue(null);

    await expect(
      generateEmailSignatureWithKey({}, input, mockContext, mockInfo),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should throw INVALID_REQUEST if profile not found', async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('profile-id');
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue(null);

    await expect(
      generateEmailSignatureWithKey({}, input, mockContext, mockInfo),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw INVALID_REQUEST if profile or webCard is incomplete', async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('profile-id');
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: {
        id: 'profile-id',
        userId: 'user-1',
        contactCard: null,
      },
      webCard: {
        userName: null,
        isMultiUser: false,
      },
    });

    await expect(
      generateEmailSignatureWithKey({}, input, mockContext, mockInfo),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should throw UNAUTHORIZED if user does not own profile', async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({ id: 'user-42' });
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('profile-id');
    (getProfileWithWebCardById as jest.Mock).mockResolvedValue({
      profile: {
        id: 'profile-id',
        userId: 'user-1',
        contactCard: { some: 'data' },
      },
      webCard: {
        userName: 'demo',
        isMultiUser: false,
      },
    });

    await expect(
      generateEmailSignatureWithKey({}, input, mockContext, mockInfo),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });
});
