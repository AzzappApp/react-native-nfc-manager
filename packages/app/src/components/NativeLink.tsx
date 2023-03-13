import { cloneElement } from 'react';
import { useRouter } from '#PlatformEnvironment';
import type { LinkProps } from '#PlatformEnvironment';
import type { Route } from '#routes';
import type { GestureResponderEvent } from 'react-native';

/**
 * Native implementation of the Link component.
 */
const NativeLink = ({ route, params, replace, modal, children }: LinkProps) => {
  const router = useRouter();
  const onLinkPress = (event?: GestureResponderEvent) => {
    children.props.onPress?.(event);
    if (event?.isDefaultPrevented()) {
      return;
    }
    if (replace) {
      router.replace({ route, params } as Route);
    } else if (modal) {
      router.showModal({ route, params } as Route);
    } else {
      router.push({ route, params } as Route);
    }
  };

  return cloneElement(children, {
    accessibilityRole: 'link',
    onPress: onLinkPress,
  });
};

export default NativeLink;
