import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  dialect: 'mysql',
  schema: './src/*',
  dbCredentials: {
    url: `mysql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/azzapp?ssl={"rejectUnauthorized":true}`,
  },
  tablesFilter: ['!_*'],
  out: './drizzle',
} satisfies Config;
