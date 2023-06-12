import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/domains/*',
  connectionString: process.env.DATABASE_URL,
  out: './drizzle',
} satisfies Config;
