import { graphQLSchema, createGraphQLContext } from '@azzapp/data';
import { graphql } from 'graphql';
import { fetchQuery } from 'react-relay';
import { Environment, Network, RecordSource, Store } from 'relay-runtime';
import type { AuthInfos } from './session';
import type {
  GraphQLTaggedNode,
  Variables,
  OperationType,
  GraphQLResponse,
} from 'relay-runtime';

export function createServerNetwork(authInfos?: AuthInfos) {
  return Network.create(async (text, variables) => {
    const context = createGraphQLContext(authInfos);
    const results = await graphql({
      schema: graphQLSchema,
      source: text.text!,
      variableValues: variables,
      contextValue: context,
    });
    return results as GraphQLResponse;
  });
}

export const createServerEnvironment = (authInfos?: AuthInfos) =>
  new Environment({
    network: createServerNetwork(authInfos),
    store: new Store(new RecordSource()),
    isServer: true,
  });

export const preloadServerQuery = async <T extends OperationType>(
  query: GraphQLTaggedNode,
  variables: Variables,
  authInfos?: AuthInfos,
) => {
  const environment = createServerEnvironment(authInfos);

  return {
    data: await fetchQuery<T>(environment, query, variables, {
      fetchPolicy: 'network-only',
    }).toPromise(),
    initialRecords: environment.getStore().getSource().toJSON(),
  };
};
