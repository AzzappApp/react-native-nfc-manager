import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { createReport, getReport } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import { postCommentLoader, postLoader, webCardLoader } from '#loaders';
import type { MutationResolvers } from '#/__generated__/types';
import type { Post, PostComment, WebCard, NewReport } from '@azzapp/data';

const sendReport: MutationResolvers['sendReport'] = async (_, { id }) => {
  const { id: targetId, type } = fromGlobalId(id);

  const targetType = getTargetType(type);

  const { userId } = getSessionInfos();
  if (!userId) throw new GraphQLError(ERRORS.UNAUTHORIZED);
  try {
    let target: Post | PostComment | WebCard | null;
    switch (type) {
      case 'Post':
        target = await postLoader.load(targetId);
        break;
      case 'WebCard':
        target = await webCardLoader.load(targetId);
        break;
      case 'PostComment':
        target = await postCommentLoader.load(targetId);
        break;
      default:
        throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const report: NewReport = {
      targetId,
      targetType,
      userId,
    };

    if (target?.deleted) {
      const date = new Date();
      report.treatedBy = target.deletedBy;
      report.createdAt = date; // createdAt cannot be after treatedAt
      report.treatedAt = date;
    }

    await createReport(report);

    return {
      created: true,
      report: {
        targetId,
        targetType,
        userId,
      },
    };
  } catch (e) {
    const report = await getReport(targetId, userId, targetType);
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
