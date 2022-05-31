import {
  Environment,
  RecordSource,
  ROOT_TYPE,
  Store,
  Network,
  QueryResponseCache,
} from 'relay-runtime';
import { fetchJSON } from './networkHelpers';
import type {
  MissingFieldHandler,
  FetchFunction,
  GraphQLResponse,
} from 'relay-runtime';

type CreateRelayEnvironmentParams = {
  fetchFunction?: typeof fetchJSON;
  cacheConfig?: { size?: number; ttl?: number };
};

const createRelayEnvironment = ({
  fetchFunction = fetchJSON,
  cacheConfig,
}: CreateRelayEnvironmentParams = {}) => {
  const responseCache = cacheConfig
    ? new QueryResponseCache({
        size: 100,
        ttl: 10000,
      })
    : null;
  const environment = new Environment({
    network: createNetwork(responseCache, fetchFunction),
    store: new Store(new RecordSource()),
    isServer: false,
    missingFieldHandlers,
  });
  (environment.getNetwork() as any).responseCache = responseCache;
  return environment;
};

export default createRelayEnvironment;

const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/graphql`;

const createNetwork = (
  responseCache: QueryResponseCache | null,
  fetchFunction: typeof fetchJSON,
) => {
  const fetchGraphQL: FetchFunction = async (
    request,
    variables,
    cacheConfig,
  ) => {
    const { id, text, operationKind } = request;
    const isQuery = operationKind === 'query';
    const forceFetch = cacheConfig ? cacheConfig.force : false;
    if (responseCache && isQuery && !forceFetch) {
      const fromCache = responseCache.get(id!, variables);
      if (fromCache != null) {
        return Promise.resolve(fromCache);
      }
    }
    return fetchFunction<GraphQLResponse>(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        text ? { query: text, variables } : { id, variables },
      ),
    });
  };

  return Network.create(fetchGraphQL);
};

const missingFieldHandlers: MissingFieldHandler[] = [
  {
    handle(field, record, argValues) {
      if (
        record != null &&
        record.__typename === ROOT_TYPE &&
        field.name === 'node' &&
        // eslint-disable-next-line no-prototype-builtins
        argValues.hasOwnProperty('id')
      ) {
        // If field is user(id: $id), look up the record by the value of $id
        return argValues.id;
      }
    },
    kind: 'linked',
  },
];
