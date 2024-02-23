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
} from 'relay-runtime';

let environment: Environment | null;

type RelayEnvironmentListener = (event: 'reset') => void;
const listeners: RelayEnvironmentListener[] = [];

export const getRelayEnvironment = () => {
  if (!environment) {
    init();
  }
  return environment!;
};

export const addEnvironmentListener = (listener: RelayEnvironmentListener) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

const init = () => {
  createEnvironment();
  let authState = getAuthState();
  addAuthStateListener(newAuthState => {
    if (!newAuthState.authenticated && authState.authenticated) {
      resetEnvironment();
    }
    authState = newAuthState;
  });
};

const createMMKVForUser = () => {
  const userId = getAuthState().profileInfos?.userId;
  if (!userId) {
    return null;
  }
  return new MMKV({ id: `relay_${userId}` });
};

const createSource = () => {
  let currentMMKV = createMMKVForUser();

  const createInnerSourceWithOfflineData = () => {
    let record: any;
    try {
      const json = currentMMKV?.getString('relayRecord');
      if (json) {
        record = JSON.parse(json);
      } else {
        record = {};
      }
    } catch {
      record = {};
    }
    return RecordSource.create(record);
  };

  let innerSource = createInnerSourceWithOfflineData();

  const authState = getAuthState();
  addAuthStateListener(newAuthState => {
    if (newAuthState.profileInfos?.userId !== authState.profileInfos?.userId) {
      currentMMKV = createMMKVForUser();
      innerSource = createInnerSourceWithOfflineData();
    }
  });

  let saveTimeout: any = null;
  const scheduleSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      currentMMKV?.set('relayRecord', JSON.stringify(innerSource.toJSON()));
    }, 1000);
  };

  const wrapSetMethod = <TMethod extends (...args: any[]) => any>(
    method: TMethod,
  ) => {
    return ((...args: Parameters<TMethod>) => {
      method.apply(innerSource, args);
      scheduleSave();
    }) as TMethod;
  };

  return new Proxy(
    {},
    {
      get: (_, key: keyof typeof innerSource) => {
        const method = innerSource[key];
        if (
          key === 'set' ||
          key === 'delete' ||
          key === 'remove' ||
          key === 'clear'
        ) {
          return wrapSetMethod(method);
        }
        return method;
      },
    },
  ) as typeof innerSource;
};

const createEnvironment = () => {
  environment = new Environment({
    store: new Store(createSource()),
    network: createNetwork(),
    missingFieldHandlers,
    isServer: false,
  });
};

const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/graphql`;

export const createNetwork = () => {
  const fetchFunction = fetchWithGlobalEvents(fetchWithAuthTokens(fetchJSON));

  const fetchGraphQL: FetchFunction = (request, variables) =>
    Observable.create<GraphQLResponse>(sink => {
      const abortController = new AbortController();

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

const resetEnvironment = () => {
  createEnvironment();
  listeners.forEach(listener => listener('reset'));
};
