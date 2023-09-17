import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/domains/*',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? '',
  },
  driver: 'mysql2',
  out: './drizzle',
} satisfies Config;
