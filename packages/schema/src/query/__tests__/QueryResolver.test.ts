import latinize from 'latinize';
import {
  getWebCardById,
  getWebCardByUserNamePrefixWithRedirection,
} from '@azzapp/data/src/queries/webCardQueries';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { isUserNameAvailable } from '#helpers/webCardHelpers';
import { Query } from '../QueryResolvers';

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('latinize', () => jest.fn());

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileAdminRight: jest.fn(),
}));

jest.mock('@azzapp/data/src/queries/webCardQueries', () => ({
  getWebCardById: jest.fn(),
  getWebCardByUserNamePrefixWithRedirection: jest.fn(),
}));

jest.mock('#helpers/webCardHelpers', () => ({
  isUserNameAvailable: jest.fn(),
}));

const latinizeMock = latinize as jest.MockedFunction<typeof latinize>;

describe('Query Resolvers ', () => {
  describe('getProposedUserName Resolver ', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return null if no webcard found', async () => {
      (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
      (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(true);
      (getWebCardById as jest.Mock).mockResolvedValue(null);

      const mockContext = {} as any;
      const mockInfo = {} as any;

      const result = await Query.getProposedUserName?.(
        {},
        { webcardId: '' },
        mockContext,
        mockInfo,
      );
      expect(result).toBe(null);
    });

    test('should return null if no profileName found', async () => {
      (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
      (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(true);
      (getWebCardById as jest.Mock).mockResolvedValue({});
      latinizeMock.mockReturnValue('');

      const mockContext = {} as any;
      const mockInfo = {} as any;

      const result = await Query.getProposedUserName?.(
        {},
        { webcardId: '' },
        mockContext,
        mockInfo,
      );
      expect(result).toBe(null);
    });

    test('should return profileName if profileName is available', async () => {
      (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
      (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(true);
      (getWebCardById as jest.Mock).mockResolvedValue({});
      latinizeMock.mockReturnValue('profileName');
      (isUserNameAvailable as jest.Mock).mockResolvedValue({ available: true });

      const mockContext = {} as any;
      const mockInfo = {} as any;

      const result = await Query.getProposedUserName?.(
        {},
        { webcardId: '' },
        mockContext,
        mockInfo,
      );
      expect(result).toBe('profileName');
    });

    test('should return profileName0 if profileName is not available', async () => {
      (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
      (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(true);
      (getWebCardById as jest.Mock).mockResolvedValue({});
      latinizeMock.mockReturnValue('profileName');
      (isUserNameAvailable as jest.Mock).mockResolvedValue({
        available: false,
      });
      (
        getWebCardByUserNamePrefixWithRedirection as jest.Mock
      ).mockResolvedValue(['profileName']);

      const mockContext = {} as any;
      const mockInfo = {} as any;

      const result = await Query.getProposedUserName?.(
        {},
        { webcardId: '' },
        mockContext,
        mockInfo,
      );
      expect(result).not.toBe('profileName');
      expect(result).toBe('profileName0');
    });

    test('should return profileName2 if profileName is not available and there is many webcard with this profileName', async () => {
      (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
      (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(true);
      (getWebCardById as jest.Mock).mockResolvedValue({});
      latinizeMock.mockReturnValue('profileName');
      (isUserNameAvailable as jest.Mock).mockResolvedValue({
        available: false,
      });
      (
        getWebCardByUserNamePrefixWithRedirection as jest.Mock
      ).mockResolvedValue(['profileName', 'ProfileNaMe0', 'profilename1']);

      const mockContext = {} as any;
      const mockInfo = {} as any;

      const result = await Query.getProposedUserName?.(
        {},
        { webcardId: '' },
        mockContext,
        mockInfo,
      );
      expect(result).not.toBe('profileName');
      expect(result).toBe('profileName2');
    });

    test('should return proFileNamE with case sensibility', async () => {
      (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
      (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(true);
      (getWebCardById as jest.Mock).mockResolvedValue({});
      latinizeMock.mockReturnValue('proFileNamE');
      (isUserNameAvailable as jest.Mock).mockResolvedValue({
        available: false,
      });
      (
        getWebCardByUserNamePrefixWithRedirection as jest.Mock
      ).mockResolvedValue(['profileName']);

      const mockContext = {} as any;
      const mockInfo = {} as any;

      const result = await Query.getProposedUserName?.(
        {},
        { webcardId: '' },
        mockContext,
        mockInfo,
      );
      expect(result).not.toBe('profileName0');
      expect(result).toBe('proFileNamE0');
    });

    test('should return null if we have 1000 webcard with same name', async () => {
      (fromGlobalIdWithType as jest.Mock).mockReturnValue('123');
      (checkWebCardProfileAdminRight as jest.Mock).mockResolvedValue(true);
      (getWebCardById as jest.Mock).mockResolvedValue({});
      latinizeMock.mockReturnValue('proFileNamE');
      (isUserNameAvailable as jest.Mock).mockResolvedValue({
        available: false,
      });
      (
        getWebCardByUserNamePrefixWithRedirection as jest.Mock
      ).mockResolvedValue(
        Array.from(Array(1000).keys()).map((_, index) => `profileName${index}`),
      );

      const mockContext = {} as any;
      const mockInfo = {} as any;

      const result = await Query.getProposedUserName?.(
        {},
        { webcardId: '' },
        mockContext,
        mockInfo,
      );
      expect(result).toBe(null);
    });
  });
});
