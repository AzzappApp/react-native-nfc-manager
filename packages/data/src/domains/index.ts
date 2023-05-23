import db from './db';
import type {
  ReactionKind,
  Card,
  CardCover,
  CardModule,
  CompanyActivity,
  Follow,
  Media,
  MediaKind,
  Post,
  PostReaction,
  PostComment,
  ProfileCategory,
  ProfileKind,
  Profile,
  Interest,
  CoverTemplate,
  StaticMedia,
  User,
} from '@prisma/client';

export type {
  Card,
  CardCover,
  CardModule,
  CoverTemplate,
  CompanyActivity,
  Follow,
  Media,
  MediaKind,
  Post,
  PostReaction,
  PostComment,
  Profile,
  ProfileCategory,
  ProfileKind,
  ReactionKind,
  Interest,
  User,
  StaticMedia,
};

export { db };

export * from './cards';
export * from './cardCovers';
export * from './cardModules';
export * from './companyActivities';
export * from './staticMedias';
export * from './posts';
export * from './users';
export * from './medias';
export * from './follows';
export * from './profiles';
export * from './coverTemplates';
export * from './interests';
export * from './profileCategories';
export * from './postReactions';
export * from './postComments';
