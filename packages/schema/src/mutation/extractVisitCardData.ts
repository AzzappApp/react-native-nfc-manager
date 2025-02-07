import { captureException } from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
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
    const { userId } = getSessionInfos();

    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
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
            model: 'gpt-4-turbo',
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
      const match = data.choices[0].message.content.match(/\{[^}]*\}/); // Extract JSON object from the response
      return match ? businessCardSchema.parse(JSON.parse(match[0])) : null;
    } catch (error) {
      captureException(error);
    }

    return null;
  };
