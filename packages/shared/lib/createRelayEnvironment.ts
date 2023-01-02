import {
  Environment,
  RecordSource,
  ROOT_TYPE,
  Store,
  Network,
  Observable,
} from 'relay-runtime';
import { fetchJSON, isAbortError } from './networkHelpers';
import type {
  MissingFieldHandler,
  FetchFunction,
  GraphQLResponse,
  RequestParameters,
} from 'relay-runtime';

type CreateRelayEnvironmentParams = {
  fetchFunction?: typeof fetchJSON;
  isServer?: boolean;
  retries?: number[];
};

/**
 * Factory used by both web and mobile applications used to create the Relay Environement
 *
 * @param options
 * @returns a Relay environment
 */
const createRelayEnvironment = ({
  fetchFunction = fetchJSON,
  isServer = false,
}: CreateRelayEnvironmentParams = {}) => {
  const environment = new Environment({
    network: createNetwork(fetchFunction),
    store: new Store(new RecordSource()),
    isServer,
    missingFieldHandlers,
  });
  return environment;
};

export default createRelayEnvironment;

const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/graphql`;

export const createNetwork = (fetchFunction: typeof fetchJSON) => {
  const fetchGraphQL: FetchFunction = (request, variables) =>
    Observable.create<GraphQLResponse>(sink => {
      const abortController = new AbortController();
      const { id, text } = request;

      fetchFunction<GraphQLResponse>(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          text ? { query: text, variables } : { id, variables },
        ),
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
