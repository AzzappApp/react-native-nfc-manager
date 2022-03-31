import { useRouter } from '@azzapp/app/lib/PlatformEnvironment';
import { Pressable } from 'react-native';
import type { LinkProps } from '@azzapp/app/lib/PlatformEnvironment';
import type { GestureResponderEvent } from 'react-native';

const Link = ({
  route,
  params,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  replace,
  modal,
  options,
  onPress,
  ...props
}: LinkProps) => {
  const router = useRouter();
  const onLinkPress = (event: GestureResponderEvent) => {
    if (modal) {
      router.showModal(route, params, options);
    } else {
      router.push(route, params, options);
    }
    onPress?.(event);
  };

  return (
    <Pressable onPress={onLinkPress} accessibilityRole="link" {...props} />
  );
};

export default Link;
