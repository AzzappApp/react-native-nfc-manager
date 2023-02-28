import db from './db';
import type {
  Card,
  CardCover,
  CoverLayer,
  CardModule,
  Follow,
  Media,
  MediaKind,
  Post,
  User,
  ProfileKind,
  Profile,
} from '@prisma/client';

type Viewer =
  | {
      isAnonymous: false;
      userId: string;
      profileId: string;
    }
  | { isAnonymous: true };

export type {
  Card,
  CardCover,
  CardModule,
  CoverLayer,
  Follow,
  Media,
  MediaKind,
  Post,
  User,
  ProfileKind,
  Profile,
  Viewer,
};

export { db };

export * from './cards';
export * from './cardCovers';
export * from './cardModules';
export * from './coverLayers';
export * from './posts';
export * from './users';
export * from './medias';
export * from './follows';
export * from './profiles';
