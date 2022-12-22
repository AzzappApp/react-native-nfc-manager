import NextLink from 'next/link';
import { cloneElement } from 'react';
import { routesToPath } from '../helpers/routesMap';
import type { LinkProps } from '@azzapp/app/lib/PlatformEnvironment';

const Link = ({ route, params, replace, children }: LinkProps) => (
  <NextLink
    replace={replace}
    href={routesToPath({ route, params } as any)}
    passHref
    legacyBehavior
  >
    {cloneElement(children, { accessibilityRole: 'link' })}
  </NextLink>
);

export default Link;
