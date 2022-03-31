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
      getCurrenRoute() {
        return {
          route: pathRoRoutes(nextRoute ? nextRoute.pathname : Router.pathname),
          params: nextRoute ? nextRoute.query : Router.query,
        };
      },
      push(route, params) {
        void Router.push(routesToPath(route, params));
      },
      replace(route, params) {
        void Router.replace(routesToPath(route, params));
      },
      showModal(route, params) {
        console.error('Show modal does not work on web');
        void Router.replace(routesToPath(route, params));
      },
      back() {
        Router.back();
      },
      addRouteDidChangeListener(callbak) {
        const listener = () => {
          // TODO does this route is good at this moment ?
          const { route, params } = this.getCurrenRoute();
          callbak(route, params);
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
          const { route, params } = this.getCurrenRoute();
          callbak(route, params);
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
    launchImagePicker: () => {
      throw new Error();
    },
    WebAPI: { ...WebAPI, refreshTokens: () => Promise.resolve({} as any) },
  };
};

export default createPlatformEnvironment;
