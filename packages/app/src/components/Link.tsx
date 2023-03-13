import { usePlatformEnvironment } from '#PlatformEnvironment';
import type { LinkProps } from '#PlatformEnvironment';

/**
 * A link component that adapts to the current platform.
 * On web, it uses an next/link component.
 * On mobile, it uses a react-native pressable component.
 * it should be given a child that is a react-native pressable component.
 * e.g.:
 * ```tsx
 * <Link route="HOME">
 *    <PressableNative>
 *      <Text>Home</Text>
 *    </PressableNative>
 * </Link>
 * ```
 */
const Link = (props: LinkProps) => {
  const { LinkComponent } = usePlatformEnvironment();
  return <LinkComponent {...props} />;
};

export default Link;
