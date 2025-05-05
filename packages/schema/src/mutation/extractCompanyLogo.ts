import { captureException } from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import type { MutationResolvers } from '#__generated__/types';

const apiKey = process.env.BRANDFETCH_CLIENT_ID;

export const extractCompanyLogo: MutationResolvers['extractCompanyLogo'] =
  async (_parent, args) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    try {
      const response = await fetch(
        `https://api.brandfetch.io/v2/search/${args.brand}?c=${apiKey}`,
        {
          method: 'GET',
        },
      );

      const data = (await response.json()) as BrandFetchResult[];

      return data
        .map(result => {
          return {
            id: result.brandId,
            uri: updateUrl(result.icon),
            score: parseFloat(result.qualityScore),
          };
        })
        .sort((a, b) => b.score - a.score);
    } catch (error) {
      captureException(error);
    }

    return null;
  };

const updateUrl = (url: string): string => {
  // Replace 'webp' with 'png'
  let updatedUrl = url.replace('webp', 'png');

  // Replace 'w/128' with default sizes
  updatedUrl = updatedUrl.replace(/\/w\/\d+/g, '').replace(/\/h\/\d+/g, '');

  return updatedUrl;
};

type BrandFetchResult = {
  brandId: string;
  icon: string;
  qualityScore: string;
};
