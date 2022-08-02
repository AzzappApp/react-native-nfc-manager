import { cloneElement } from 'react';
import { useRouter } from '../PlatformEnvironment';
import type { LinkProps } from '../PlatformEnvironment';
import type { Route } from '../routes';
import type { GestureResponderEvent } from 'react-native';

const NativeLink = ({
  id,
  route,
  params,
  replace,
  modal,
  children,
}: LinkProps & { id?: string }) => {
  const router = useRouter();
  const onLinkPress = (event: GestureResponderEvent) => {
    children.props.onPress?.(event);
    if (event.isDefaultPrevented()) {
      return;
    }
    if (replace) {
      router.replace({ id, route, params } as Route);
    } else if (modal) {
      router.showModal({ id, route, params } as Route);
    } else {
      router.push({ id, route, params } as Route);
    }
  };

  return cloneElement(children, {
    accessibilityRole: 'link',
    onPress: onLinkPress,
  });
};

export default NativeLink;
