/* eslint-disable @typescript-eslint/sort-type-union-intersection-members */
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { LayoutRectangle } from 'react-native';

export type HomeRoute = {
  route: 'HOME';
  params?: never;
};

export type SearchRoute = {
  route: 'SEARCH';
  params?: never;
};

export type ChatRoute = {
  route: 'CHAT';
  params?: never;
};

export type AccountRoute = {
  route: 'ACCOUNT';
  params?: never;
};

export type SignInRoute = {
  route: 'SIGN_IN';
  params?: never;
};

export type SignUpRoute = {
  route: 'SIGN_UP';
  params?: never;
};

export type ForgotPasswordRoute = {
  route: 'FORGOT_PASSWORD';
  params?: never;
};

export type ChangePasswordRoute = {
  route: 'CHANGE_PASSWORD';
  params?: never; //TODO this should coutain a reset token ?
};

export type NewProfileRoute = {
  route: 'NEW_PROFILE';
  params?: {
    goBack: boolean;
  };
};

export type ProfileRoute = {
  route: 'PROFILE';
  params: {
    userName: string;
    profileID?: string;
    fromRectangle?: LayoutRectangle;
  };
};

export type ProfilePostsRoute = {
  route: 'PROFILE_POSTS';
  params: { userName: string };
};

export type AlbumsRoute = {
  route: 'ALBUMS';
  params?: never;
};

export type PostRoute = {
  route: 'POST';
  params: {
    postId: string;
    videoTime?: number | null;
    fromRectangle?: LayoutRectangle;
  };
};

export type PostCommentsRoute = {
  route: 'POST_COMMENTS';
  params: {
    postId: string;
  };
};

export type NewPostRoute = {
  route: 'NEW_POST';
  params?: never;
};

export type CardModuleEditionRoute = {
  route: 'CARD_MODULE_EDITION';
  params: {
    module: ModuleKind | 'cover';
    moduleId?: string;
    isNew?: boolean;
  };
};

export type FollowedProfilesRoute = {
  route: 'FOLLOWED_PROFILES';
  params?: never;
};

export type FollowersRoute = {
  route: 'FOLLOWERS';
  params?: never;
};

export type AccountDetailsRoute = {
  route: 'ACCOUNT_DETAILS';
  params?: never;
};

export type Route =
  | AlbumsRoute
  | HomeRoute
  | SearchRoute
  | ChatRoute
  | AccountRoute
  | ProfileRoute
  | ProfilePostsRoute
  | PostRoute
  | PostCommentsRoute
  | NewPostRoute
  | NewProfileRoute
  | ChangePasswordRoute
  | SignInRoute
  | SignUpRoute
  | ForgotPasswordRoute
  | CardModuleEditionRoute
  | FollowedProfilesRoute
  | FollowersRoute
  | AccountDetailsRoute;

export type ROUTES = Route['route'];
