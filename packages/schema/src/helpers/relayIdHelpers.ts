import { GraphQLError } from 'graphql';
import { fromGlobalId, toGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';

export const idResolver =
  (typeName: string) =>
  <T extends { id: string }>(obj: T) =>
    toGlobalId(typeName, obj.id);

const fromGlobalIdWithType = (globalId: string, type: string): string => {
  const { type: idType, id } = fromGlobalId(globalId);

  if (idType !== type) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  return id;
};

export const maybeFromGlobalIdWithType = (
  globalId: string,
  type: string,
): string | null => {
  try {
    return fromGlobalIdWithType(globalId, type);
  } catch {
    return null;
  }
};

export default fromGlobalIdWithType;
