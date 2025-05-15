import { z } from 'zod';

export const schema = z.object({
  PEXEL_API_KEY: z.string().default('').describe('Pexels API key'),
  OPENAI_API_SECRET_KEY: z.string().default('').describe('OpenAI API key'),
  USERNAME_CHANGE_FREQUENCY_DAY: z
    .string()
    .default('1')
    .describe('Nb of days between username changes'),
  USERNAME_REDIRECTION_AVAILABILITY_DAY: z
    .string()
    .default('2')
    .describe('Nb of days before username redirection is active'),
  MAX_ENRICHMENTS_PER_USER: z
    .string()
    .default('10')
    .describe('Max enrichments per user'),
});

const env = schema.safeParse(process.env);

if (!env.success) {
  console.error(
    '❌ schema - invalid environment variables:',
    env.error.format(),
  );
}

export default env.data!;
