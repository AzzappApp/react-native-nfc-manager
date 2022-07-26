import { Pressable } from 'react-native';
import { useRouter } from '../PlatformEnvironment';
import type { LinkProps } from '../PlatformEnvironment';
import type { GestureResponderEvent } from 'react-native';

const NativeLink = ({
  route,
  params,
  replace,
  modal,
  onPress,
  ...props
}: LinkProps) => {
  const router = useRouter();
  const onLinkPress = (event: GestureResponderEvent) => {
    if (replace) {
      router.replace(route, params);
    } else if (modal) {
      router.showModal(route, params);
    } else {
      router.push(route, params);
    }
    onPress?.(event);
  };

  return (
    <Pressable onPress={onLinkPress} accessibilityRole="link" {...props} />
  );
};

export default NativeLink;
