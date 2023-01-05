import { Kysely } from 'kysely';
import { PlanetScaleDialect } from 'kysely-planetscale';
import type {
  Card,
  CardCover,
  CardModule,
  Follow,
  Media,
  Post,
  User,
} from '@prisma/client';

export type Database = {
  Card: Card;
  CardCover: CardCover;
  CardModule: CardModule;
  Follow: Follow;
  Media: Media;
  Post: Post;
  User: User;
};

const db = new Kysely<Database>({
  dialect: new PlanetScaleDialect({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    fetch(input, init) {
      return fetch(input, { ...init, cache: 'no-store' });
    },
  }),
});

export default db;
