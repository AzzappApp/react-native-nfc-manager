import type { Routes } from '@azzapp/shared/lib/routes';

const routesMap: { [key in Routes]: string } = {
  HOME: '/home',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  USER: '/[userId]',
  CHAT: '/chat',
  NEW_POST: '/[userId]/newPost',
  PROFILE: '/profile',
  SEARCH: '/search',
  POST: '/[userId]/[postId]',
};

const inverseRoutesMap: { [key: string]: Routes } = Object.fromEntries(
  Object.entries(routesMap).map(([key, value]) => [value, key as Routes]),
);

export const routesToPath = (route: Routes, params: any) => {
  return routesMap[route].replace(/\[(\w+)\]/g, (_, paramName) => {
    return params?.[paramName] ?? '';
  });
};

export const pathRoRoutes = (pathname: string): Routes => {
  return inverseRoutesMap[pathname];
};
