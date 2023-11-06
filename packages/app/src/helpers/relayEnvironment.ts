import { fromGlobalId } from 'graphql-relay';
import {
  ROOT_TYPE,
  Network,
  Observable,
  Store,
  RecordSource,
} from 'relay-runtime';
import { MultiActorEnvironment } from 'relay-runtime/lib/multi-actor-environment';
// @ts-expect-error not typed
import { create as createRelayOptimisticRecordSource } from 'relay-runtime/lib/store/RelayOptimisticRecordSource';
import { fetchJSON, isAbortError } from '@azzapp/shared/networkHelpers';
import { version as APP_VERSION } from '../../package.json';
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

export const ROOT_ACTOR_ID = 'ROOT_ACTOR_ID';

let environment: MultiActorEnvironment | null;

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

const createEnvironment = () => {
  const rootStore = new Store(RecordSource.create());

  environment = new MultiActorEnvironment({
    createNetworkForActor: (actorId: string) => createNetwork(actorId),
    createStoreForActor: (actorId: string) => {
      if (actorId === ROOT_ACTOR_ID) {
        return rootStore;
      }
      return new Store(
        createRelayOptimisticRecordSource(rootStore.getSource()),
      );
    },
    missingFieldHandlers,
    isServer: false,
  });
};

const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/graphql`;

export const createNetwork = (actorId: string) => {
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

      const webCardId = actorId === ROOT_ACTOR_ID ? null : actorId;

      if (webCardId) {
        const { id } = fromGlobalId(webCardId);
        headers['azzapp-webCardId'] = id;
      }

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
