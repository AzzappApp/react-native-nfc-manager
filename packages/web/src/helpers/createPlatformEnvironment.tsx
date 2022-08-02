import * as WebAPI from '@azzapp/shared/lib/WebAPI';
import Router from 'next/router';
import Link from '../components/Link';
import { pathRoRoutes, routesToPath } from './routesMap';
import type { PlatformEnvironment } from '@azzapp/app/lib/PlatformEnvironment';
import type { ParsedUrlQuery } from 'querystring';

const createPlatformEnvironment = (nextRoute?: {
  pathname: string;
  query: ParsedUrlQuery;
}): PlatformEnvironment => {
  return {
    router: {
      getCurrentRoute() {
        return {
          route: pathRoRoutes(nextRoute ? nextRoute.pathname : Router.pathname),
          params: nextRoute ? nextRoute.query : Router.query,
        } as any;
      },
      push(route) {
        void Router.push(routesToPath(route));
      },
      replace(route) {
        void Router.replace(routesToPath(route));
      },
      showModal(route) {
        console.error('Show modal does not work on web');
        void Router.replace(routesToPath(route));
      },
      back() {
        Router.back();
      },
      addRouteDidChangeListener(callbak) {
        const listener = () => {
          // TODO does this route is good at this moment ?
          callbak(this.getCurrentRoute());
        };

        Router.events.on('routeChangeStart', listener);

        return {
          dispose() {
            Router.events.on('routeChangeStart', listener);
          },
        };
      },
      addRouteWillChangeListener(callbak) {
        const listener = () => {
          // TODO does this route is good at this moment ?
          callbak(this.getCurrentRoute());
        };

        Router.events.on('routeChangeStart', listener);

        return {
          dispose() {
            Router.events.on('routeChangeStart', listener);
          },
        };
      },
    },
    LinkComponent: Link,
    WebAPI: { ...WebAPI, refreshTokens: () => Promise.resolve({} as any) },
  };
};

export default createPlatformEnvironment;
