import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { getProfileById } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import { webCardOwnerLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';

const apiKey = process.env.OPENAI_API_SECRETKEY;

const businessCardSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phoneNumbers: z.array(z.string()).nullable(),
  emails: z.array(z.string()).nullable(),
  addresses: z.array(z.string()).nullable(),
  company: z.string().nullable(),
  title: z.string().nullable(),
  urls: z.array(z.string()).nullable(),
});

export const extractVisitCardData: MutationResolvers['extractVisitCardData'] =
  async (_parent, args) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    if (!args.config?.createContactCard) {
      if (args.config?.profileId) {
        const profileId = fromGlobalIdWithType(
          args.config.profileId,
          'Profile',
        );

        const profile = await getProfileById(profileId);

        if (!profile) {
          throw new GraphQLError(ERRORS.INVALID_REQUEST);
        }
        const ownerId =
          profile.profileRole === 'owner'
            ? profile.userId
            : (await webCardOwnerLoader.load(profile.webCardId))?.id;
        if (!ownerId) {
          throw new GraphQLError(ERRORS.INVALID_REQUEST);
        }
        await validateCurrentSubscription(ownerId, {
          action: 'USE_SCAN',
        });
      } else {
        await validateCurrentSubscription(user.id, {
          action: 'USE_SCAN',
        });
      }
    }

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an assistant that extracts structured information from a business card. The output format is JSON with the following fields: firstName, lastName, phoneNumbers (as array, in international format when possible), emails (as array), addresses (as array), company, title, urls (as array).',
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Can you extract the details ?',
                  },
                  { type: 'image_url', image_url: { url: args.imgUrl } },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        Sentry.captureMessage('cannot parse AI answer request', {
          extra: {
            image: args.imgUrl,
            data,
          },
        });
        return null;
      }
      const match = data.choices[0].message.content.match(/\{[^}]*\}/); // Extract JSON object from the response
      const businessCard = match
        ? businessCardSchema.parse(JSON.parse(match[0]))
        : null;
      if (!businessCard) {
        return null;
      }
      const cleanBusinessCard = {
        ...businessCard,
        emails: businessCard?.emails?.map(email => email.replaceAll(' ', '')),
      };
      return cleanBusinessCard;
    } catch (error) {
      Sentry.captureException(error);
    }

    return null;
  };
