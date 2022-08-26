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

export type UserRoute = {
  route: 'USER';
  params: {
    userName: string;
    userId?: string;
    imageIndex?: number;
    videoTime?: number | null;
    fromRectangle?: LayoutRectangle;
    snapshotID?: string;
    setOriginCoverState?: (state: {
      imageIndex?: number;
      videoTime?: number | null;
    }) => void;
  };
};

export type UserPostsRoute = {
  route: 'USER_POSTS';
  params: { userName: string };
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
  | UserRoute
  | UserPostsRoute
  | NewPostRoute;

export type ROUTES = Route['route'];
