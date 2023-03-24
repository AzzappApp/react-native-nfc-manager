import { fromGlobalId, nodeDefinitions } from 'graphql-relay';
import type { Card, CardCover, CoverTemplate, Post, Profile } from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const profileSymbol = Symbol('Profile');
const cardSymbol = Symbol('Card');
const postSymbol = Symbol('Post');
const coverTemplate = Symbol('CoverTemplate');

const fetchNode = async (
  gqlId: string,
  {
    profileLoader,
    cardLoader,
    postLoader,
    coverTemplateLoader,
  }: GraphQLContext,
): Promise<Card | CardCover | CoverTemplate | Post | Profile | null> => {
  const { id, type } = fromGlobalId(gqlId);
  switch (type) {
    case 'Profile':
      return withTypeSymbol(await profileLoader.load(id), profileSymbol);
    case 'Card':
      return withTypeSymbol(await cardLoader.load(id), cardSymbol);
    case 'Post':
      return withTypeSymbol(await postLoader.load(id), postSymbol);
    case 'CoverTemplate':
      return withTypeSymbol(await coverTemplateLoader.load(id), coverTemplate);
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
  if (value[coverTemplate]) {
    return 'CoverTemplate';
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
