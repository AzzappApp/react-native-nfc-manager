import { useRouter } from '@azzapp/app/lib/PlatformEnvironment';
import { Pressable } from 'react-native';
import type { LinkProps } from '@azzapp/app/lib/PlatformEnvironment';
import type { GestureResponderEvent } from 'react-native';

const Link = ({
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

export default Link;
