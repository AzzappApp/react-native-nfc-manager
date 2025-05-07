import { GraphQLError } from 'graphql';
import {
  transaction,
  updateWebCard,
  updateWebCardProfiles,
} from '@azzapp/data';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import ERRORS from '@azzapp/shared/errors';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { notifyRelatedWalletPasses } from '#helpers/webCardHelpers';
import saveCommonInformation from '../saveCommonInformation';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  referencesMedias: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateWebCard: jest.fn(),
  updateWebCardProfiles: jest.fn(),
}));

jest.mock('@azzapp/service/mediaServices/mediaServices', () => ({
  checkMedias: jest.fn(),
}));

jest.mock('#helpers/webCardHelpers', () => ({
  notifyRelatedWalletPasses: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileAdminRight: jest.fn(),
}));

jest.mock('@sentry/nextjs', () => ({
  captureMessage: jest.fn(),
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

  test('should successfully save common information and notify related Wallet passes', async () => {
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

    expect(updateWebCard).toHaveBeenCalledWith('webcard-123', {
      commonInformation: { company: 'New Company' },
      logoId: undefined,
    });
    expect(updateWebCardProfiles).toHaveBeenCalledWith('webcard-123', {
      lastContactCardUpdate: expect.any(Date),
    });
    expect(notifyRelatedWalletPasses).toHaveBeenCalledWith('webcard-123'); // ✅ Check if passes are notified
    expect(result).toEqual({
      webCard: {
        ...mockWebCard,
        commonInformation: { company: 'New Company' },
        logoId: undefined,
      },
    });
  });

  test('should not notify Wallet passes if transaction fails', async () => {
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
    expect(notifyRelatedWalletPasses).not.toHaveBeenCalled(); // ✅ Check if passes are not notified when transaction fail
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
    expect(notifyRelatedWalletPasses).not.toHaveBeenCalled();
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
    expect(notifyRelatedWalletPasses).not.toHaveBeenCalled();
  });

  test('should not call checkMedias if no logo and no banner is provided', async () => {
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

    expect(checkMedias).toHaveBeenCalledWith([]);
  });

  test('should call checkMedias with logoId ', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (transaction as jest.Mock).mockResolvedValue(undefined);

    await saveCommonInformation(
      {},
      {
        webCardId: 'global-webcard-123',
        input: { company: 'New Company', logoId: 'logoId' },
      },
      mockContext,
      mockInfo,
    );

    expect(checkMedias).toHaveBeenCalledWith(['logoId']);
  });

  test('should call checkMedias with bannerId ', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (transaction as jest.Mock).mockResolvedValue(undefined);

    await saveCommonInformation(
      {},
      {
        webCardId: 'global-webcard-123',
        input: { company: 'New Company', bannerId: 'bannerId' },
      },
      mockContext,
      mockInfo,
    );

    expect(checkMedias).toHaveBeenCalledWith(['bannerId']);
  });

  test('should call checkMedias with bannerId and logoId ', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (transaction as jest.Mock).mockResolvedValue(undefined);

    await saveCommonInformation(
      {},
      {
        webCardId: 'global-webcard-123',
        input: {
          company: 'New Company',
          logoId: 'logoId',
          bannerId: 'bannerId',
        },
      },
      mockContext,
      mockInfo,
    );

    expect(checkMedias).toHaveBeenCalledWith(['logoId', 'bannerId']);
  });
});
