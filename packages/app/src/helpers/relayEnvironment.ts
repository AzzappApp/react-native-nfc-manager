import { MMKV } from 'react-native-mmkv';
import {
  ROOT_TYPE,
  Network,
  Observable,
  Store,
  RecordSource,
  Environment,
} from 'relay-runtime';
import ERRORS from '@azzapp/shared/errors';
import { fetchJSON, isAbortError } from '@azzapp/shared/networkHelpers';
import { version as APP_VERSION } from '../../package.json';
import { addAuthStateListener, getAuthState } from './authStore';
import fetchWithAuthTokens from './fetchWithAuthTokens';
import fetchWithGlobalEvents from './fetchWithGlobalEvents';
import { dispatchGlobalEvent } from './globalEvents';
import { getCurrentLocale } from './localeHelpers';
import type {
  MissingFieldHandler,
  FetchFunction,
  GraphQLResponse,
  RequestParameters,
  Variables,
} from 'relay-runtime';

let environment: Environment | null;

export const getRelayEnvironment = () => {
  if (!environment) {
    init();
  }
  return environment!;
};

const init = () => {
  createEnvironment();
  let authState = getAuthState();
  addAuthStateListener(newAuthState => {
    if (!newAuthState.authenticated && authState.authenticated) {
      createEnvironment();
    }
    authState = newAuthState;
  });
};

const createEnvironment = () => {
  environment = new Environment({
    store: new Store(RecordSource.create()),
    network: createNetwork(),
    missingFieldHandlers,
    isServer: false,
  });
};

const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/graphql`;

const createMMKVForUser = () => {
  const userId = getAuthState().profileInfos?.userId;
  if (!userId) {
    return null;
  }
  return new MMKV({ id: `relay_${userId}` });
};

const createMMKVResponseCache = () => {
  let currentMMKV = createMMKVForUser();
  const authState = getAuthState();
  addAuthStateListener(newAuthState => {
    if (newAuthState.profileInfos?.userId !== authState.profileInfos?.userId) {
      currentMMKV = createMMKVForUser();
    }
  });

  const getCacheKey = (queryID: string, variables: Variables): string => {
    return JSON.stringify(stableCopy({ queryID, variables }));
  };

  return {
    get: (queryID: string, variables: Variables) => {
      const queryKey = getCacheKey(queryID, variables);
      const response = currentMMKV?.getString(queryKey);
      try {
        return response ? JSON.parse(response) : null;
      } catch {
        return null;
      }
    },
    set: (queryID: string, variables: Variables, payload: GraphQLResponse) => {
      try {
        const queryKey = getCacheKey(queryID, variables);
        currentMMKV?.set(queryKey, JSON.stringify(payload));
      } catch {
        // ignore
      }
    },
    reset: () => {
      try {
        currentMMKV?.clearAll();
      } catch {
        // ignore
      }
    },
  };
};

// CC from https://github.com/facebook/relay/blob/bb30bb611a50eb4d5235bdb3ab5c84adca312552/packages/relay-runtime/util/stableCopy.js
const stableCopy = (value: any): any => {
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(stableCopy);
  }
  const keys = Object.keys(value).sort();
  const stable: any = {};
  for (let i = 0; i < keys.length; i++) {
    stable[keys[i]] = stableCopy(value[keys[i]]);
  }
  return stable;
};

const createNetwork = () => {
  const fetchFunction = fetchWithGlobalEvents(fetchWithAuthTokens(fetchJSON));
  const offlineCache = createMMKVResponseCache();

  const fetchGraphQL: FetchFunction = (request, variables, cacheConfig) =>
    Observable.create<GraphQLResponse>(sink => {
      const abortController = new AbortController();

      const queryID = request.text ?? request.id;
      const shouldUseOfflineCache =
        cacheConfig?.metadata?.useOfflineCache === true;
      const cacheOnly = cacheConfig?.metadata?.cacheOnly === true;

      if (shouldUseOfflineCache) {
        if (request.operationKind === 'mutation') {
          throw new Error('Mutation should not be cached');
        }
        if (request.operationKind === 'subscription') {
          throw new Error('Subscription should not be cached');
        }
      }

      if (shouldUseOfflineCache && queryID) {
        const response = offlineCache.get(queryID, variables);
        if (response) {
          sink.next(response);
          if (cacheOnly) {
            sink.complete();
            return;
          }
        }
      }

      if (
        request.operationKind === 'mutation' &&
        cacheConfig?.metadata?.eraseCache !== false
      ) {
        offlineCache.reset();
      }

      const params: {
        query?: string;
        id?: string;
        variables?: Record<string, unknown>;
      } = {};

      const { id, text } = request;
      if (text) {
        params.query = text;
      }
      if (id) {
        params.id = id;
      }
      params.variables = variables;

      const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'azzapp-appVersion': APP_VERSION,
        'x-vercel-protection-bypass':
          process.env.AZZAPP_API_VERCEL_PROTECTION_BYPASS ?? '',
      };

      const locale = getCurrentLocale();
      if (locale) {
        headers['azzapp-locale'] = locale;
      }

      fetchFunction<GraphQLResponse>(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        signal: abortController.signal,
      })
        .then(
          async result => {
            if (sink.closed) {
              return;
            }
            if (
              !result ||
              'errors' in result ||
              ('data' in result && result.data == null)
            ) {
              const error = new GraphQLError(result, request);
              await dispatchGlobalEvent({
                type: 'NETWORK_ERROR',
                payload: { error, params: [request, variables] },
              });
              if (error.message === ERRORS.INVALID_TOKEN) {
                sink.complete();
              } else {
                sink.error(error);
              }
            } else {
              if (queryID && shouldUseOfflineCache) {
                offlineCache.set(queryID, variables, result);
              }
              sink.next(result);
            }
            sink.complete();
          },
          error => {
            if (sink.closed) {
              return;
            }
            if (isAbortError(error)) {
              sink.complete();
            } else {
              sink.error(error);
            }
          },
        )
        .catch(error => {
          // this avoid this promise to catch error in sink callbacks
          setTimeout(() => {
            throw error;
          });
        });

      return () => {
        abortController.abort();
      };
    });

  return Network.create(fetchGraphQL);
};

export class GraphQLError extends Error {
  response: GraphQLResponse;
  request: RequestParameters;
  constructor(response: GraphQLResponse, request: RequestParameters) {
    let message = 'Errors';
    if (!!response && 'errors' in response) {
      message = response.errors?.[0]?.message ?? 'Errors';
    }
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphQLError);
    }
    this.name = 'GraphQLError';
    this.response = response;
    this.request = request;
  }
}

const missingFieldHandlers: MissingFieldHandler[] = [
  {
    handle(field, record, argValues) {
      if (
        record != null &&
        record.getType() === ROOT_TYPE &&
        field.name === 'node' &&
        // eslint-disable-next-line no-prototype-builtins
        argValues.hasOwnProperty('id')
      ) {
        return argValues.id;
      }
    },
    kind: 'linked',
  },
];
