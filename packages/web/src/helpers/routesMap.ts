import type { Route } from '@azzapp/app/lib/routes';

const routesMap: { [key in Route['route']]: string } = {
  HOME: '/home',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  USER: '/[userName]',
  USER_POSTS: '/[userName]/posts',
  NEW_POST: '/[userName]/newPost',
};

const inverseRoutesMap: { [key: string]: Route['route'] } = Object.fromEntries(
  Object.entries(routesMap).map(([key, value]) => [
    value,
    key as Route['route'],
  ]),
);

export const routesToPath = ({ route, params }: Route) => {
  return routesMap[route].replace(/\[(\w+)\]/g, (_, paramName) => {
    return (params as any)?.[paramName] ?? '';
  });
};

export const pathRoRoutes = (pathname: string): Route['route'] => {
  return inverseRoutesMap[pathname];
};
