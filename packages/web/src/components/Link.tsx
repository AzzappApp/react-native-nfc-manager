import NextLink from 'next/link';
import { cloneElement } from 'react';
import { routeToPath } from '../helpers/routesHelpers';
import type { LinkProps } from '@azzapp/app/lib/PlatformEnvironment';

const Link = ({ route, params, replace, children }: LinkProps) => (
  <NextLink
    replace={replace}
    href={routeToPath({ route, params } as any)}
    passHref
    legacyBehavior
  >
    {cloneElement(children, { accessibilityRole: 'link' })}
  </NextLink>
);

export default Link;
