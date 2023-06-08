import { toGlobalId } from 'graphql-relay';
import type { GraphQLContext } from './GraphQLContext';
import type { Prisma } from '.prisma/client';

export const idResolver =
  (typeName: string) =>
  <T extends { id: string }>(obj: T) =>
    toGlobalId(typeName, obj.id);

export const getLabel = <T extends { labels: Prisma.JsonValue }>(
  { labels }: T,
  _: unknown,
  { locale }: GraphQLContext,
) =>
  labels &&
  typeof labels === 'object' &&
  locale in labels &&
  !Array.isArray(labels)
    ? (labels[locale] as string)
    : null;
