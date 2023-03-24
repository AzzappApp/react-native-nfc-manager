/* eslint-disable @typescript-eslint/sort-type-union-intersection-members */
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

export type SettingsRoute = {
  route: 'SETTINGS';
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

export type OnBoardingRoute = {
  route: 'ONBOARDING';
  params?: never; //TODO this should coutain a reset token ?
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

export type PostRoute = {
  route: 'POST';
  params: {
    postId: string;
    videoTime?: number | null;
    fromRectangle?: LayoutRectangle;
  };
};

export type NewPostRoute = {
  route: 'NEW_POST';
  params?: never;
};

export type CardModuleEditionRoute = {
  route: 'CARD_MODULE_EDITION';
  params: {
    module: string;
    templateId?: string;
  };
};

export type Route =
  | HomeRoute
  | SearchRoute
  | ChatRoute
  | SettingsRoute
  | ProfileRoute
  | ProfilePostsRoute
  | PostRoute
  | NewPostRoute
  | OnBoardingRoute
  | ChangePasswordRoute
  | OnBoardingRoute
  | SignInRoute
  | SignUpRoute
  | ForgotPasswordRoute
  | CardModuleEditionRoute;

export type ROUTES = Route['route'];
