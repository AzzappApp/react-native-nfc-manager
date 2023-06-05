import type { Route } from '@azzapp/app/routes';

export const routeToPath = ({ route, params }: Route) => {
  const tokens = routesPathTokens[route];
  if (!tokens) {
    throw new Error(`No path found for route: ${route}`);
  }
  return compilePath(tokens, params as any);
};

export const pathToRoute = (pathname: string): Route => {
  const segments = pathname.split('/').filter(val => !!val);
  for (const { route, pathTokens } of pathMatchs) {
    const params = matchPath(segments, pathTokens);
    if (params) {
      return { route, params } as Route;
    }
  }
  throw new Error(`No route found for path: ${pathname}`);
};

const routesMap: { [key in Route['route']]: string } = {
  HOME: '/home',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  FORGOT_PASSWORD: '/forgotPassword',
  CHANGE_PASSWORD: '/changePassword',
  PROFILE: '/[userName]',
  PROFILE_POSTS: '/[userName]/posts',
  POST_COMMENTS: '/[postId]/comments',
  POST: '/posts/[postId]',
  NEW_POST: '/[userName]/newPost',
  SEARCH: '/search',
  ACCOUNT: '/account',
  FOLLOWED_PROFILES: '/followedProfiles',
  FOLLOWERS: '/followers',
  ALBUMS: '/albums',
  CHAT: '/chat',
  NEW_PROFILE: '/profile/new',
  CARD_MODULE_EDITION: '/my-card/edit/[module]',
};

type PathToken = {
  kind: 'DYNAMIC' | 'MATCH_ALL' | 'STATIC';
  name: string;
};

const matchAllSegmentRegexp = /^\[\.\.\.([^\]]+)\]$/;
const dynamicSegmentRegexp = /^\[([^\]]+)\]$/;

const pathMatchs = Object.entries(routesMap)
  .map(([route, path]) => ({
    route,
    pathTokens: path
      .split('/')
      .slice(1)
      .map((segment): PathToken => {
        const matchAllResult = matchAllSegmentRegexp.exec(segment);
        if (matchAllResult) {
          return { kind: 'MATCH_ALL', name: matchAllResult[1] };
        }
        const dynamicSegmentRegexpResult = dynamicSegmentRegexp.exec(segment);
        if (dynamicSegmentRegexpResult) {
          return { kind: 'DYNAMIC', name: dynamicSegmentRegexpResult[1] };
        }
        return { kind: 'STATIC', name: segment };
      }),
  }))
  .sort((a, b) => {
    for (
      let i = 0;
      i < Math.max(a.pathTokens.length, b.pathTokens.length);
      i++
    ) {
      const aSegment = a.pathTokens[i];
      const bSegment = b.pathTokens[i];

      if (!aSegment && bSegment) {
        return 1;
      }
      if (aSegment && !bSegment) {
        return -1;
      }
      if (aSegment.kind === 'MATCH_ALL' && bSegment.kind !== 'MATCH_ALL') {
        return 1;
      }
      if (aSegment.kind !== 'MATCH_ALL' && bSegment.kind === 'MATCH_ALL') {
        return -1;
      }
      if (aSegment.kind === 'DYNAMIC' && bSegment.kind !== 'DYNAMIC') {
        return 1;
      }
      if (aSegment.kind !== 'DYNAMIC' && bSegment.kind === 'DYNAMIC') {
        return -1;
      }
    }
    return 0;
  });

const routesPathTokens = Object.fromEntries(
  pathMatchs.map(({ route, pathTokens: segments }) => [route, segments]),
);

const matchPath = (segments: string[], pathTokens: PathToken[]) => {
  const params: Record<string, any> = {};

  for (let i = 0; i < Math.max(segments.length, pathTokens.length); i++) {
    const token = pathTokens[i];
    const segment = segments[i];

    if (!token || !segment) {
      return null;
    }

    if (token.kind === 'STATIC' && token.name !== segment) {
      return null;
    }
    if (token.kind === 'DYNAMIC') {
      params[token.name] = segment;
    }
    if (token.kind === 'MATCH_ALL') {
      params[token.name] = segments.slice(i);
      break;
    }
  }

  return params;
};

const compilePath = (segments: PathToken[], params: Record<string, any>) => {
  const path = segments
    .map(token => {
      if (token.kind === 'STATIC') {
        return token.name;
      }
      if (token.kind === 'DYNAMIC') {
        return params[token.name];
      }
      return params[token.name].join('/');
    })
    .join('/');
  return `/${path}`;
};
