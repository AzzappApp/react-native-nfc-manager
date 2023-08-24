import { fromGlobalId } from 'graphql-relay';
import {
  Environment,
  RecordSource,
  ROOT_TYPE,
  Store,
  Network,
  Observable,
} from 'relay-runtime';
import { fetchJSON, isAbortError } from '@azzapp/shared/networkHelpers';
import { addAuthStateListener, getAuthState } from './authStore';
import fetchWithAuthTokens from './fetchWithAuthTokens';
import fetchWithGlobalEvents from './fetchWithGlobalEvents';
import { getCurrentLocale } from './localeHelpers';
import type {
  MissingFieldHandler,
  FetchFunction,
  GraphQLResponse,
  RequestParameters,
} from 'relay-runtime';

let environment: Environment | null;

type RelayEnvironmentListener = (event: 'invalidateViewer' | 'reset') => void;
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
    if (newAuthState.profileId !== authState.profileId) {
      profileChanged();
    }
    if (!newAuthState.authenticated && authState.authenticated) {
      resetEnvironment();
    }
    authState = newAuthState;
  });
};

const createEnvironment = () => {
  environment = new Environment({
    network: createNetwork(),
    store: new Store(new RecordSource()),
    isServer: false,
    missingFieldHandlers,
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
        profileId?: string;
        locale?: string;
      } = {};

      const { id, text } = request;
      if (text) {
        params.query = text;
      }
      if (id) {
        params.id = id;
      }
      params.variables = variables;

      const profileId = getAuthState().profileId;
      if (profileId) {
        const { id } = fromGlobalId(profileId);
        params.profileId = id;
      }

      const locale = getCurrentLocale();
      if (locale) {
        params.locale = locale;
      }

      fetchFunction<GraphQLResponse>(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: abortController.signal,
      })
        .then(
          result => {
            if (sink.closed) {
              return;
            }
            if (
              !result ||
              'errors' in result ||
              ('data' in result && result.data == null)
            ) {
              sink.error(new GraphQLError(result, request));
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
    super('Errors');
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
        // @ts-expect-error it seems like the type of record is not correct
        record.__typename === ROOT_TYPE &&
        field.name === 'node' &&
        argValues?.['id'] != null
      ) {
        // If field is node(id: $id), look up the record by the value of $id
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

const profileChanged = () => {
  environment?.commitUpdate(store => {
    store.getRoot().getLinkedRecord('viewer')?.invalidateRecord();
  });
  listeners.forEach(listener => listener('invalidateViewer'));
};
