import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/schema.ts',
  dbCredentials: {
    url: `mysql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/azzapp?ssl={"rejectUnauthorized":true}`,
  },
  tablesFilter: ['!_*'],
  out: './drizzle',
});
