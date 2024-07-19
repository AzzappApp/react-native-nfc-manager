import { toGlobalId } from 'graphql-relay';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import type { GraphQLContext } from './GraphQLContext';

export const idResolver =
  (typeName: string) =>
  <T extends { id: string }>(obj: T) =>
    toGlobalId(typeName, obj.id);

export const getLabel = async <T extends { id: string }>(
  { id }: T,
  _: unknown,
  { locale, loaders }: GraphQLContext,
) => {
  let label = await loaders.labels.load([id, locale]);
  if (!label) {
    label = await loaders.labels.load([id, DEFAULT_LOCALE]);
  }
  return label?.value ?? '';
};
