import NextLink from 'next/link';
import { Pressable } from 'react-native';
import { routesToPath } from '../helpers/routesMap';
import type { LinkProps } from '@azzapp/app/lib/PlatformEnvironment';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Link = ({ route, params, replace, modal, ...props }: LinkProps) => (
  <NextLink replace={replace} href={routesToPath(route, params)} passHref>
    <Pressable accessibilityRole="link" {...props} />
  </NextLink>
);

export default Link;
