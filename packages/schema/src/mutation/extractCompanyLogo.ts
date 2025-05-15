import { captureException } from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { getLogos } from '@azzapp/enrichment';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import type { MutationResolvers } from '#__generated__/types';

export const extractCompanyLogo: MutationResolvers['extractCompanyLogo'] =
  async (_parent, args) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    try {
      return getLogos(args.brand);
    } catch (error) {
      captureException(error);
    }

    return null;
  };
