import { GraphQLError } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import { getProfilesFromWebCard, getWebCardById } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { sendEmailSignatures } from '#externals';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import sendEmailSignaturesMutation from '../sendEmailSignatures';

jest.mock('@azzapp/data', () => ({
  getProfilesFromWebCard: jest.fn(),
  getWebCardById: jest.fn(),
}));

jest.mock('#externals', () => ({
  sendEmailSignatures: jest.fn(),
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileAdminRight: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () =>
  jest.fn(id => id.replace('gql-', '')),
);

describe('sendEmailSignaturesMutation', () => {
  const mockContext = {} as any;
  const mockInfo = {} as any;
  const webCardId = 'webcard-1';
  const gqlWebCardId = 'gql-webcard-1';
  const profiles = [
    { id: 'profile-1', email: 'profile-1@email.com' },
    { id: 'profile-2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getWebCardById as jest.Mock).mockResolvedValue({ id: webCardId });
    (getProfilesFromWebCard as jest.Mock).mockResolvedValue(profiles);
  });

  it('throws if neither profileIds nor allProfiles is provided', async () => {
    await expect(
      sendEmailSignaturesMutation(
        {},
        { webCardId: gqlWebCardId, profileIds: undefined, allProfiles: false },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  it('throws if webCard is not found', async () => {
    (getWebCardById as jest.Mock).mockResolvedValue(null);

    await expect(
      sendEmailSignaturesMutation(
        {},
        {
          webCardId: gqlWebCardId,
          profileIds: ['gql-profile-1'],
          allProfiles: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  it('calls checkWebCardProfileAdminRight with correct webCardId', async () => {
    await sendEmailSignaturesMutation(
      {},
      {
        webCardId: gqlWebCardId,
        profileIds: ['gql-profile-1'],
        allProfiles: false,
      },
      mockContext,
      mockInfo,
    );

    expect(checkWebCardProfileAdminRight).toHaveBeenCalledWith(webCardId);
  });

  it('calls sendEmailSignatures with correct profile IDs', async () => {
    await sendEmailSignaturesMutation(
      {},
      {
        webCardId: gqlWebCardId,
        profileIds: ['gql-profile-1', 'gql-profile-2'],
        allProfiles: false,
      },
      mockContext,
      mockInfo,
    );

    expect(sendEmailSignatures).toHaveBeenCalledWith(['profile-1'], {
      id: webCardId,
    });
  });

  it('returns the correct response', async () => {
    const result = await sendEmailSignaturesMutation(
      {},
      {
        webCardId: gqlWebCardId,
        profileIds: ['gql-profile-1', 'gql-profile-2'],
        allProfiles: false,
      },
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      profileIds: [toGlobalId('Profile', 'profile-1')],
      profileIdsWithoutEmail: [toGlobalId('Profile', 'profile-2')],
      sentCount: 1,
    });
  });

  it('throws if we try to send email to user without email', async () => {
    (getProfilesFromWebCard as jest.Mock).mockResolvedValue([
      { id: 'profile-1' },
    ]);

    await expect(
      sendEmailSignaturesMutation(
        {},
        {
          webCardId: gqlWebCardId,
          profileIds: ['gql-profile-1'],
          allProfiles: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.USER_NO_EMAIL));
  });
});
