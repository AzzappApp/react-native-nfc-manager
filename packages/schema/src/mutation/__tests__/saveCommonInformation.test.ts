import { GraphQLError } from 'graphql';
import {
  checkMedias,
  referencesMedias,
  transaction,
  updateWebCard,
  updateWebCardProfiles,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import saveCommonInformation from '../saveCommonInformation';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  checkMedias: jest.fn(),
  referencesMedias: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateWebCard: jest.fn(),
  updateWebCardProfiles: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileAdminRight: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('saveCommonInformation', () => {
  const mockWebCard = {
    id: 'webcard-123',
    commonInformation: { company: 'Old Company' },
    logoId: 'old-logo-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully save common information without a logo', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(undefined);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);

    const result = await saveCommonInformation(
      {},
      {
        webCardId: 'global-webcard-123',
        input: { company: 'New Company' },
      },
      mockContext,
      mockInfo,
    );

    expect(fromGlobalIdWithType).toHaveBeenCalledWith(
      'global-webcard-123',
      'WebCard',
    );
    expect(checkWebCardProfileAdminRight).toHaveBeenCalledWith('webcard-123');
    expect(updateWebCard).toHaveBeenCalledWith('webcard-123', {
      commonInformation: { company: 'New Company' },
      logoId: undefined,
    });
    expect(updateWebCardProfiles).toHaveBeenCalledWith('webcard-123', {
      lastContactCardUpdate: expect.any(Date),
    });
    expect(referencesMedias).toHaveBeenCalledWith([], ['old-logo-id']);

    expect(result).toEqual({
      webCard: {
        ...mockWebCard,
        commonInformation: { company: 'New Company' },
        logoId: undefined,
      },
    });
  });

  test('should successfully save common information with a new logo', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(undefined);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (checkMedias as jest.Mock).mockResolvedValue(undefined);

    const result = await saveCommonInformation(
      {},
      {
        webCardId: 'global-webcard-123',
        input: { company: 'Updated Company', logoId: 'new-logo-id' },
      },
      mockContext,
      mockInfo,
    );

    expect(checkMedias).toHaveBeenCalledWith(['new-logo-id']);
    expect(updateWebCard).toHaveBeenCalledWith('webcard-123', {
      commonInformation: { company: 'Updated Company' },
      logoId: 'new-logo-id',
    });
    expect(referencesMedias).toHaveBeenCalledWith(
      ['new-logo-id'],
      ['old-logo-id'],
    );

    expect(result).toEqual({
      webCard: {
        ...mockWebCard,
        commonInformation: { company: 'Updated Company' },
        logoId: 'new-logo-id',
      },
    });
  });

  test('should throw UNAUTHORIZED if user lacks admin rights', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardProfileAdminRight as jest.Mock).mockRejectedValue(
      new GraphQLError(ERRORS.UNAUTHORIZED),
    );

    await expect(
      saveCommonInformation(
        {},
        { webCardId: 'global-webcard-123', input: { company: 'Test Company' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(updateWebCard).not.toHaveBeenCalled();
  });

  test('should throw INVALID_REQUEST if web card is not found', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (webCardLoader.load as jest.Mock).mockResolvedValue(null);
    (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(undefined);

    await expect(
      saveCommonInformation(
        {},
        { webCardId: 'global-webcard-123', input: { company: 'Test Company' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));

    expect(updateWebCard).not.toHaveBeenCalled();
  });

  test('should throw INTERNAL_SERVER_ERROR if transaction fails', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (transaction as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(
      saveCommonInformation(
        {},
        { webCardId: 'global-webcard-123', input: { company: 'Test Company' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));

    expect(updateWebCard).not.toHaveBeenCalled();
  });

  test('should not call checkMedias if no logo is provided', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (transaction as jest.Mock).mockResolvedValue(undefined);

    await saveCommonInformation(
      {},
      {
        webCardId: 'global-webcard-123',
        input: { company: 'New Company' },
      },
      mockContext,
      mockInfo,
    );

    expect(checkMedias).not.toHaveBeenCalled();
  });
});
