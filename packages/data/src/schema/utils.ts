import { toGlobalId } from 'graphql-relay';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import type { GraphQLContext } from './GraphQLContext';

export const idResolver =
  (typeName: string) =>
  <T extends { id: string }>(obj: T) =>
    toGlobalId(typeName, obj.id);

export const getLabel = <T extends { labels: { [key: string]: string } }>(
  { labels }: T,
  _: unknown,
  { locale }: GraphQLContext,
) => (labels ? labels[locale] ?? labels[DEFAULT_LOCALE] : null);
