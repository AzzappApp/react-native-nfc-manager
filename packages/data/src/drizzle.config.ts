import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import env from './env';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/schema.ts',
  dbCredentials: {
    url: `mysql://${env.DATABASE_USERNAME}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}/azzapp?ssl={"rejectUnauthorized":true}`,
  },
  tablesFilter: ['!_*'],
  out: './drizzle',
});
