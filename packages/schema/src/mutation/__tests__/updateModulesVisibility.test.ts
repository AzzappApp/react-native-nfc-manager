import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import {
  getCardModulesByIds,
  getWebCardById,
  transaction,
  updateCardModules,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard, notifyWebCardUsers } from '#externals';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import updateModulesVisibility from '../updateModulesVisibility';

jest.mock('graphql-relay', () => ({ fromGlobalId: jest.fn() }));
jest.mock('@azzapp/data', () => ({
  getCardModulesByIds: jest.fn(),
  getWebCardById: jest.fn(),
  transaction: jest.fn(fn => fn()),
  updateCardModules: jest.fn(),
  updateWebCard: jest.fn(),
}));
jest.mock('#externals', () => ({
  invalidateWebCard: jest.fn(),
  notifyWebCardUsers: jest.fn(),
}));
jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileEditorRight: jest.fn(),
}));

describe('updateModulesVisibility', () => {
  const mockContext: any = {};
  const mockInfo: any = {};

  const webCardId = 'webcard-123';
  const gqlWebCardId = 'gql-webcard-123';
  const webCard = {
    id: webCardId,
    userName: 'testUser',
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fromGlobalId as jest.Mock).mockReturnValue({ id: webCardId });
    (getWebCardById as jest.Mock).mockResolvedValue(webCard);
    (getCardModulesByIds as jest.Mock).mockResolvedValue([
      { id: 'module-1', webCardId },
      { id: 'module-2', webCardId },
    ]);
  });

  it('throws if no module IDs provided', async () => {
    await expect(
      updateModulesVisibility(
        {},
        { webCardId: gqlWebCardId, input: { modulesIds: [], visible: true } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  it('throws if webCard not found', async () => {
    (getWebCardById as jest.Mock).mockResolvedValue(null);

    await expect(
      updateModulesVisibility(
        {},
        {
          webCardId: gqlWebCardId,
          input: { modulesIds: ['mod-1'], visible: true },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));
  });

  it('throws if module not part of webCard', async () => {
    (getCardModulesByIds as jest.Mock).mockResolvedValue([
      { id: 'module-1', webCardId: 'other-card' },
    ]);

    await expect(
      updateModulesVisibility(
        {},
        {
          webCardId: gqlWebCardId,
          input: { modulesIds: ['mod-1'], visible: true },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  it('successfully updates visibility and notifies/invalidate', async () => {
    const result = await updateModulesVisibility(
      {},
      {
        webCardId: gqlWebCardId,
        input: { modulesIds: ['mod-1', 'mod-2'], visible: true },
      },
      mockContext,
      mockInfo,
    );

    expect(checkWebCardProfileEditorRight).toHaveBeenCalledWith(webCardId);
    expect(updateCardModules).toHaveBeenCalledWith(['mod-1', 'mod-2'], {
      visible: true,
    });
    expect(updateWebCard).toHaveBeenCalled();
    expect(notifyWebCardUsers).toHaveBeenCalledWith(webCard);
    expect(invalidateWebCard).toHaveBeenCalledWith('testUser');
    expect(result).toEqual({ webCard });
  });

  it('throws INTERNAL_SERVER_ERROR if transaction fails', async () => {
    (transaction as jest.Mock).mockImplementation(() => {
      throw new Error('db fail');
    });

    await expect(
      updateModulesVisibility(
        {},
        {
          webCardId: gqlWebCardId,
          input: { modulesIds: ['mod-1'], visible: false },
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));
  });
});
