import { z } from 'zod';

export const schema = z.object({
  PROXY_CURL_KEY: z.string().default('').describe('API Key for ProxyCurl'),
  PEOPLEDATALABS_KEY: z
    .string()
    .default('')
    .describe('API Key for PeopleDataLabs'),
  PERPLEXITY_API_KEY: z.string().default('').describe('API Key for Perplexity'),
  IPQUALITYSCORE_KEY: z
    .string()
    .default('')
    .describe('API Key for IPQualityScore'),
  ENABLE_ENRICHMENT_MONITORING: z
    .enum(['true', 'false'])
    .default('false')
    .describe('Enable enrichment monitoring'),
  BRANDFETCH_CLIENT_ID: z.string().default('').describe('Brandfetch API key'),
});

const env = schema.safeParse(process.env);

if (!env.success) {
  console.error(
    '❌ enrichment - invalid environment variables:',
    env.error.format(),
  );
}

export default env.data!;
