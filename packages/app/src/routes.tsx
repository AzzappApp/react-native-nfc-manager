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

export type NewProfileRoute = {
  route: 'NEW_PROFILE';
  params?: {
    profileId: string;
  };
};

export type ProfileRoute = {
  route: 'PROFILE';
  params: {
    userName: string;
    profileId?: string;
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

export type AccountDetailsRoute = {
  route: 'ACCOUNT_DETAILS';
  params?: never;
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
  | MediaRoute
  | NewPostRoute
  | NewProfileRoute
  | OnboardingRoute
  | PostCommentsRoute
  | PostRoute
  | ProfileRoute
  | ResetPasswordRoute
  | SearchRoute
  | SignInRoute
  | SignUpRoute;

export type ROUTES = Route['route'];

export const isRouteEqual = (route: Route, compareRoute: Route) => {
  if (route.route !== compareRoute.route) {
    return false;
  }
  if (route.route === 'POST' && compareRoute.route === 'POST') {
    return route.params.postId === compareRoute.params.postId;
  }
  if (route.route === 'PROFILE' && compareRoute.route === 'PROFILE') {
    return (
      route.params.userName === compareRoute.params.userName &&
      route.params.profileId === compareRoute.params.profileId
    );
  }
  return isEqual(route.params, compareRoute.params);
};
