import { useCallback, useMemo } from 'react';
import { Admin, Resource } from 'react-admin';
import ERRORS from '@azzapp/shared/errors';
import { fetchJSON } from '@azzapp/shared/networkHelpers';
import { refreshTokens, signin } from '@azzapp/shared/WebAPI';
import coverLayerList from '#components/CoverLayer';
import coverTemplateList from '#components/CoverTemplate';
import interest from '#components/Interest';
import profileCatgoryList from '#components/ProfileCategory';
import userList from '#components/UserList';
import { getTokens, removeTokens, setTokens } from '#helpers/tokenStore';
import type { AuthProvider } from 'react-admin';

const App = () => {
  const fetchWithRefreshToken = useCallback(
    async <JSON = unknown,>(
      input: RequestInfo,
      init?: RequestInit & { timeout?: number; retries?: number[] },
    ): Promise<JSON | null> => {
      const { token, refreshToken } = getTokens() ?? {};
      if (!token || !refreshToken) {
        throw new Error(ERRORS.INVALID_TOKEN);
      }
      try {
        return await fetchJSON<JSON>(input, injectToken(token, init));
      } catch (e) {
        if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
          try {
            const tokens = await refreshTokens(refreshToken);
            setTokens(tokens);
          } catch {
            removeTokens();
            throw new Error(ERRORS.INVALID_TOKEN);
          }
          const token = getTokens()?.token;
          return fetchJSON<JSON>(input, injectToken(token, init));
        }
        throw e;
      }
    },
    [],
  );

  const dataProvider = useMemo(() => {
    const commandWrapper =
      (command: string) => (resource: string, params: any) =>
        fetchWithRefreshToken(`/api/backoffice/`, {
          method: 'POST',
          body: JSON.stringify({
            command,
            resource,
            params,
          }),
        });

    const commands = [
      'getOne',
      'getList',
      'getMany',
      'getManyReference',
      'update',
      'updateMany',
      'create',
      'delete',
      'deleteMany',
    ];

    return commands.reduce((acc, command) => {
      acc[command] = commandWrapper(command);
      return acc;
    }, {} as any);
  }, [fetchWithRefreshToken]);

  const authProvider = useMemo<AuthProvider>(
    () => ({
      login: async ({ username, password }) => {
        await signin({
          credential: username,
          password,
          authMethod: 'token',
        }).then(tokens => {
          setTokens(tokens);
        });
      },
      logout: async () => {
        removeTokens();
      },
      checkAuth: async () => {
        const { token, refreshToken } = getTokens() ?? {};
        if (!token || !refreshToken) {
          throw new Error(ERRORS.INVALID_TOKEN);
        }
      },
      checkError: async error => {
        if (error instanceof Error) {
          if (
            error.message === ERRORS.INVALID_TOKEN ||
            error.message === ERRORS.UNAUTORIZED ||
            error.message === ERRORS.UNAUTORIZED_INVALID_ACCESS_TOKEN
          ) {
            throw error;
          }
        }
      },
      getPermissions: async () => Promise.resolve(),
    }),
    [],
  );

  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider} requireAuth>
      <Resource {...userList} />
      <Resource {...coverLayerList} />
      <Resource {...coverTemplateList} />
      <Resource {...profileCatgoryList} />
      <Resource {...interest} />
    </Admin>
  );
};

export default App;

export const injectToken = (token?: string, init?: RequestInit) => ({
  ...init,
  headers: token
    ? { ...init?.headers, Authorization: `Bearer ${token}` }
    : init?.headers,
});
