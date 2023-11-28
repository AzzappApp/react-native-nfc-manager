import { isEqual } from 'lodash';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { LayoutRectangle } from 'react-native';

export type HomeRoute = {
  route: 'HOME';
  params?: never;
};

export type MediaRoute = {
  route: 'MEDIA';
  params?: never;
};

export type SearchRoute = {
  route: 'SEARCH';
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

export type ForgotPasswordConfirmationRoute = {
  route: 'FORGOT_PASSWORD_CONFIRMATION';
  params: {
    issuer: string;
  };
};

export type NewWebCardRoute = {
  route: 'NEW_WEBCARD';
  params?: {
    webCardId: string;
  };
};

export type WebCardRoute = {
  route: 'WEBCARD';
  params: {
    userName: string;
    webCardId?: string;
    fromRectangle?: LayoutRectangle;
    showPosts?: boolean;
    contactData?: string | null;
    editing?: boolean;
  };
};
export type PostRoute = {
  route: 'POST';
  params: {
    postId: string;
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
  params?: { fromProfile: boolean };
};

export type CoverEditionRoute = {
  route: 'COVER_EDITION';
  params?: { isCreation?: boolean; coverKind?: 'others' | 'people' | 'video' };
};

export type CardModuleEditionRoute = {
  route: 'CARD_MODULE_EDITION';
  params: {
    module: ModuleKind;
    moduleId?: string;
    isNew?: boolean;
  };
};

export type FollowingsRoute = {
  route: 'FOLLOWINGS';
  params?: never;
};

export type FollowingsMosaicRoute = {
  route: 'FOLLOWINGS_MOSAIC';
  params?: never;
};

export type FollowersRoute = {
  route: 'FOLLOWERS';
  params?: never;
};

export type LikedPostsRoute = {
  route: 'LIKED_POSTS';
  params?: never;
};

export type AccountDetailsRoute = {
  route: 'ACCOUNT_DETAILS';
  params: {
    withProfile: boolean;
  };
};

export type InviteFriendsRoute = {
  route: 'INVITE_FRIENDS';
  params?: never;
};

export type ContactCardRoute = {
  route: 'CONTACT_CARD';
  params?: never;
};

export type ResetPasswordRoute = {
  route: 'RESET_PASSWORD';
  params: {
    token: string;
    issuer: string;
  };
};

export type OnboardingRoute = {
  route: 'ONBOARDING';
  params?: never;
};

export type MultiUserRoute = {
  route: 'MULTI_USER';
  params?: never;
};

export type MultiUserAddRoute = {
  route: 'MULTI_USER_ADD';
  params?: never;
};

export type WebcardParametersRoute = {
  route: 'WEBCARD_PARAMETERS';
  params?: never;
};

export type Route =
  | AccountDetailsRoute
  | CardModuleEditionRoute
  | ContactCardRoute
  | CoverEditionRoute
  | FollowersRoute
  | FollowingsMosaicRoute
  | FollowingsRoute
  | ForgotPasswordConfirmationRoute
  | ForgotPasswordRoute
  | HomeRoute
  | InviteFriendsRoute
  | LikedPostsRoute
  | MediaRoute
  | MultiUserAddRoute
  | MultiUserRoute
  | NewPostRoute
  | NewWebCardRoute
  | OnboardingRoute
  | PostCommentsRoute
  | PostRoute
  | ResetPasswordRoute
  | SearchRoute
  | SignInRoute
  | SignUpRoute
  | WebcardParametersRoute
  | WebCardRoute;

export type ROUTES = Route['route'];

export const isRouteEqual = (route: Route, compareRoute: Route) => {
  if (route.route !== compareRoute.route) {
    return false;
  }
  if (route.route === 'POST' && compareRoute.route === 'POST') {
    return route.params.postId === compareRoute.params.postId;
  }
  if (route.route === 'WEBCARD' && compareRoute.route === 'WEBCARD') {
    return (
      route.params.userName === compareRoute.params.userName &&
      route.params.webCardId === compareRoute.params.webCardId
    );
  }
  return isEqual(route.params, compareRoute.params);
};
