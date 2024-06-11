import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  dialect: 'mysql',
  schema: './src/*',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  tablesFilter: ['!_*'],
  out: './drizzle',
} satisfies Config;
