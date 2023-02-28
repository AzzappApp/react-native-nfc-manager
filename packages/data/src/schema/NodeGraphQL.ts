import { fromGlobalId, nodeDefinitions } from 'graphql-relay';
import type { Card, CardCover, Post, Profile } from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const profileSymbol = Symbol('Profile');
const cardSymbol = Symbol('Card');
const postSymbol = Symbol('Post');

const fetchNode = async (
  gqlId: string,
  { profileLoader, cardLoader, postLoader }: GraphQLContext,
): Promise<Card | CardCover | Post | Profile | null> => {
  const { id, type } = fromGlobalId(gqlId);
  switch (type) {
    case 'Profile':
      return withTypeSymbol(await profileLoader.load(id), profileSymbol);
    case 'Card':
      return withTypeSymbol(await cardLoader.load(id), cardSymbol);
    case 'Post':
      return withTypeSymbol(await postLoader.load(id), postSymbol);
  }
  return null;
};

const withTypeSymbol = <T extends object | null>(value: T, symbol: symbol): T =>
  (value ? { ...value, [symbol]: true } : null) as T;

const resolveNode = (value: any): string | undefined => {
  if (value[profileSymbol]) {
    return 'Profile';
  }
  if (value[cardSymbol]) {
    return 'Card';
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
