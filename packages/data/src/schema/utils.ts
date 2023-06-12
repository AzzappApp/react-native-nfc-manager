import { toGlobalId } from 'graphql-relay';
import type { GraphQLContext } from './GraphQLContext';

export const idResolver =
  (typeName: string) =>
  <T extends { id: string }>(obj: T) =>
    toGlobalId(typeName, obj.id);

export const getLabel = <T extends { labels: { [key: string]: string } }>(
  { labels }: T,
  _: unknown,
  { locale }: GraphQLContext,
) => (labels && locale in labels ? labels[locale] : null);
