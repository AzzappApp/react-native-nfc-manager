import { sql } from 'drizzle-orm';

export const DEFAULT_VARCHAR_LENGTH = 191;
export const DEFAULT_DATETIME_PRECISION = 3;
export const DEFAULT_DATETIME_VALUE = sql`CURRENT_TIMESTAMP(3)`;
