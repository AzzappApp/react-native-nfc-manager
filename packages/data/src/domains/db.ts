import { Kysely } from 'kysely';
import { PlanetScaleDialect } from 'kysely-planetscale';
import type {
  WithCreatedAt,
  WithoutJSONFields,
  WithTimeStamps,
} from './generic';
import type {
  Card,
  CardCover,
  CoverLayer,
  CoverTemplate,
  CardModule,
  Follow,
  Media,
  Profile,
  Post,
  PostReaction,
  User,
  ProfileCategory,
  CompanyActivity,
  Interest,
} from '@prisma/client';

export type Database = {
  Card: WithTimeStamps<Card>;
  CardCover: WithoutJSONFields<
    WithTimeStamps<CardCover>,
    | 'backgroundStyle'
    | 'foregroundStyle'
    | 'mediaStyle'
    | 'subTitleStyle'
    | 'titleStyle'
  >;
  CardModule: CardModule;
  CompanyActivity: CompanyActivity;
  CoverTemplate: CoverTemplate;
  CoverLayer: WithCreatedAt<CoverLayer>;
  Follow: WithCreatedAt<Follow>;
  Media: Media;
  Profile: WithTimeStamps<Profile>;
  ProfileCategory: ProfileCategory;
  Post: WithoutJSONFields<WithCreatedAt<Post>, 'medias'>;
  PostReaction: WithCreatedAt<PostReaction>;
  User: WithTimeStamps<User>;
  Interest: Interest;
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
