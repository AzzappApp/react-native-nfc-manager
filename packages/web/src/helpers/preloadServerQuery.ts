import { graphql } from 'graphql';
import { cache } from 'react';
import { createGraphQLContext, graphQLSchema } from '@azzapp/data';
import queryMap from '@azzapp/relay/query-map.json';
import ERRORS from '@azzapp/shared/errors';
import type { Viewer } from '@azzapp/auth/viewer';
import type { VariablesOf, GraphQLTaggedNode } from 'react-relay';
import type { ConcreteRequest, OperationType } from 'relay-runtime';

export type ServerQuery<TQuery extends OperationType> = {
  id: string;
  variables: VariablesOf<TQuery>;
  response: TQuery['response'];
};

const preloadServerQuery = async <TQuery extends OperationType>(
  gqlQuery: GraphQLTaggedNode,
  variables: VariablesOf<TQuery>,
  viewer?: Viewer,
): Promise<ServerQuery<TQuery>> => {
  if (typeof gqlQuery === 'function') {
    gqlQuery = gqlQuery();
  }
  if (gqlQuery.kind !== 'Request') {
    throw new Error(
      'preloadServerQuery: Expected a graphql`...` tagged query.',
    );
  }
  const request = gqlQuery as ConcreteRequest;
  const { params } = request;
  const queryVariables = { ...variables };
  const { providedVariables } = params as any;
  if (providedVariables) {
    Object.keys(providedVariables).forEach(key => {
      //@ts-expect-error no types
      queryVariables[key] = params.providedVariables[key].get();
    });
  }

  const response = await graphql({
    schema: graphQLSchema,
    source: params.text ? params.text : (queryMap as any)[params.id!],
    variableValues: queryVariables,
    contextValue: createCachedGraphQLContext(viewer ?? { isAnonymous: true }),
  });

  if (response.errors) {
    console.log(response.errors);
    throw new Error(ERRORS.GRAPHQL_ERROR, { cause: response.errors });
  }

  return {
    id: params.id ?? params.cacheID!,
    variables,
    // see https://github.com/apollographql/apollo-server/issues/3149#issuecomment-1117566982
    response: normalizeObject(response.data),
  };
};

export default preloadServerQuery;

const createCachedGraphQLContext = cache((contextData: Viewer) =>
  createGraphQLContext(contextData),
);

const normalizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj == null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeObject);
  }
  if (!(obj instanceof Object)) {
    const res = {} as any;
    const keys = Object.keys(obj);
    for (const key of keys) {
      res[key] = normalizeObject(obj[key]);
    }
    obj = res;
  }

  return obj;
};
