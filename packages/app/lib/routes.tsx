/* eslint-disable @typescript-eslint/sort-type-union-intersection-members */
// const ROUTES = {
//   HOME: 'HOME',
//   SIGN_IN: 'SIGN_IN',
//   SIGN_UP: 'SIGN_UP',
//   USER: 'USER',
//   USER_POSTS: 'USER_POSTS',
//   SEARCH: 'SEARCH',
//   NEW_POST: 'NEW_POST',
//   POST: 'POST',
//   CHAT: 'CHAT',
//   PROFILE: 'PROFILE',
// } as const;

import type { LayoutRectangle } from 'react-native';

// export default ROUTES;

// export type Routes = keyof typeof ROUTES;

export type HomeRoute = {
  route: 'HOME';
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
    videoTime?: number;
    fromRectangle?: LayoutRectangle;
    snapshotID?: string;
    setOriginCoverState?: (state: {
      imageIndex?: number;
      videoTime?: number;
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
  | SignInRoute
  | SignUpRoute
  | UserRoute
  | UserPostsRoute
  | NewPostRoute;

export type ROUTES = Route['route'];
