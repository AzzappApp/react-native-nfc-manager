import { GraphQLError } from 'graphql';

import { getCardModulesByIds, getWebCardById, transaction } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';

import reorderModules from '../reorderModules';

jest.mock('graphql-relay', () => ({
  fromGlobalId: jest.fn(id => ({ id })),
}));

jest.mock('@azzapp/data', () => ({
  getCardModulesByIds: jest.fn(),
  getWebCardById: jest.fn(),
  resetCardModulesPositions: jest.fn(),
  updateCardModule: jest.fn(),
  updateWebCard: jest.fn(),
  transaction: jest.fn(cb => cb()),
}));

jest.mock('#externals', () => ({
  invalidateWebCard: jest.fn(),
  notifyWebCardUsers: jest.fn(),
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileEditorRight: jest.fn(),
}));

const mockContext: any = {};
const mockInfo: any = {};

describe('reorderModules mutation', () => {
  const mockWebCard = {
    id: 'webcard-id',
    updatedAt: new Date('2024-01-01'),
    userName: 'azzapp',
  };

  const mockModules = [
    { id: 'mod1', webCardId: 'webcard-id' },
    { id: 'mod2', webCardId: 'webcard-id' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws INVALID_REQUEST when modulesIds is empty', async () => {
    await expect(
      reorderModules(
        {},
        { webCardId: 'webcard-id', input: { modulesIds: [] } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('throws INVALID_REQUEST when modules are missing or belong to another webCard', async () => {
    (getCardModulesByIds as jest.Mock).mockResolvedValue([
      { id: 'mod1', webCardId: 'other-webcard' },
    ]);

    await expect(
      reorderModules(
        {},
        { webCardId: 'webcard-id', input: { modulesIds: ['mod1'] } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('throws INTERNAL_SERVER_ERROR when webCard is not found', async () => {
    (getCardModulesByIds as jest.Mock).mockResolvedValue(mockModules);
    (getWebCardById as jest.Mock).mockResolvedValue(null);

    await expect(
      reorderModules(
        {},
        { webCardId: 'webcard-id', input: { modulesIds: ['mod1', 'mod2'] } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));
  });

  test('throws INTERNAL_SERVER_ERROR if transaction fails', async () => {
    (getCardModulesByIds as jest.Mock).mockResolvedValue(mockModules);
    (getWebCardById as jest.Mock).mockResolvedValue(mockWebCard);
    (transaction as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Transaction failed');
    });

    await expect(
      reorderModules(
        {},
        { webCardId: 'webcard-id', input: { modulesIds: ['mod1', 'mod2'] } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR));
  });
});
