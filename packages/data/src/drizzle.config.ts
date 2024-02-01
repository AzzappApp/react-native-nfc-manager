import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/domains/*',
  dbCredentials: {
    uri: process.env.DATABASE_URL ?? '',
  },
  tablesFilter: ['!_*'],
  driver: 'mysql2',
  out: './drizzle',
} satisfies Config;
