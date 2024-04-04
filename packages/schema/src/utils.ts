import { toGlobalId } from 'graphql-relay';
import type { GraphQLContext } from './GraphQLContext';

export const idResolver =
  (typeName: string) =>
  <T extends { id: string }>(obj: T) =>
    toGlobalId(typeName, obj.id);

export const getLabel = async <T extends { labelKey: string }>(
  { labelKey }: T,
  _: unknown,
  { locale, loaders }: GraphQLContext,
) => {
  const label = await loaders.labels.load(labelKey);
  if (label) {
    return label.translations[locale] ?? label.baseLabelValue;
  }
  return null;
};
