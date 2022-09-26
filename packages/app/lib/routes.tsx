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

export type UserRoute = {
  route: 'USER';
  params: {
    userName: string;
    userId?: string;
    imageIndex?: number;
    videoTime?: number | null;
    fromRectangle?: LayoutRectangle;
    setOriginCoverState?: (state: {
      imageIndex: number;
      videoTime?: number | null;
    }) => void;
  };
};

export type UserPostsRoute = {
  route: 'USER_POSTS';
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

export type Route =
  | HomeRoute
  | SearchRoute
  | ChatRoute
  | SettingsRoute
  | SignInRoute
  | SignUpRoute
  | ForgotPasswordRoute
  | UserRoute
  | PostRoute
  | UserPostsRoute
  | NewPostRoute;

export type ROUTES = Route['route'];
