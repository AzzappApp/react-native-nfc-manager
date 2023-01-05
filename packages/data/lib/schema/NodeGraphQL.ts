import { fromGlobalId, nodeDefinitions } from 'graphql-relay';
import type { Card, CardCover, Post, User } from '../domains';
import type { GraphQLContext } from './GraphQLContext';

const userSymbol = Symbol('User');
const cardSymbol = Symbol('Card');
const postSymbol = Symbol('Post');

const fetchNode = async (
  gqlId: string,
  { userLoader, cardLoader, postLoader }: GraphQLContext,
): Promise<Card | CardCover | Post | User | null> => {
  const { id, type } = fromGlobalId(gqlId);
  switch (type) {
    case 'User':
      return withTypeSymbol(await userLoader.load(id), userSymbol);
    case 'UserCard':
      return withTypeSymbol(await cardLoader.load(id), cardSymbol);
    case 'Post':
      return withTypeSymbol(await postLoader.load(id), postSymbol);
  }
  return null;
};

const withTypeSymbol = <T extends object | null>(value: T, symbol: symbol): T =>
  (value ? { ...value, [symbol]: true } : null) as T;

const resolveNode = (value: any): string | undefined => {
  if (value[userSymbol]) {
    return 'User';
  }
  if (value[cardSymbol]) {
    return 'UserCard';
  }
  if (value[postSymbol]) {
    return 'Post';
  }
  return undefined;
};

const {
  nodeField,
  nodesField,
  nodeInterface: NodeGraphQL,
} = nodeDefinitions(fetchNode, resolveNode);

export { nodeField, nodesField };

export default NodeGraphQL;
