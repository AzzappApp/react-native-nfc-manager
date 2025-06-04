import { z } from 'zod';

export const schema = z.object({
  DATABASE_USERNAME: z.string().default('').describe('Database username'),
  DATABASE_PASSWORD: z.string().default('').describe('Database password'),
  ENABLE_DATABASE_MONITORING: z
    .enum(['true', 'false'])
    .default('false')
    .describe('Enable database monitoring'),
  DATABASE_HOST: z.string().default('').describe('Database host'),
  REPLICA_DATABASE_HOST: z
    .string()
    .describe('Replica database host')
    .optional(),
  REPLICA_DATABASE_USERNAME: z
    .string()
    .describe('Replica database username')
    .optional(),
  REPLICA_DATABASE_PASSWORD: z
    .string()
    .describe('Replica database password')
    .optional(),
  FREE_BETA_ANDROID_DATE_LIMIT: z
    .string()
    .describe('Free beta android date limit')
    .optional(),
});

const env = schema.safeParse(process.env);

if (!env.success) {
  console.error('❌ data - invalid environment variables:', env.error.format());
}

export default env.data!;
