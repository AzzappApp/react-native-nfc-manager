import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { createReport, getReport } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';

const sendReport: MutationResolvers['sendReport'] = async (
  _,
  { id },
  { auth },
) => {
  const { id: targetId, type } = fromGlobalId(id);

  const targetType = getTargetType(type);

  if (!auth.userId) throw new GraphQLError(ERRORS.UNAUTHORIZED);
  try {
    await createReport(targetId, auth.userId, targetType);

    return {
      created: true,
      report: {
        targetId,
        targetType,
        userId: auth.userId,
      },
    };
  } catch (e) {
    const report = await getReport(targetId, auth.userId, targetType);
    if (report) {
      return {
        created: false,
        report,
      };
    }

    throw e;
  }
};

const getTargetType = (type: string) => {
  switch (type) {
    case 'WebCard':
      return 'webCard';
    case 'Post':
      return 'post';
    case 'PostComment':
      return 'comment';
    default:
      throw new Error('Invalid type');
  }
};

export default sendReport;
