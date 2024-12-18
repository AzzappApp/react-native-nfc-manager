import { cloneElement, isValidElement } from 'react';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import type { ReactElement } from 'react';
import type { ScrollViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CardModuleEditionScrollHandlerProps = ScrollViewProps & {
  children: ReactElement<{ scrollPosition: SharedValue }>;
  scrollPosition?: SharedValue<number> | undefined;
};

const CardModuleEditionScrollHandler = ({
  children,
  scrollPosition,
  ...props
}: CardModuleEditionScrollHandlerProps) => {
  if (scrollPosition) {
    return children;
  } else {
    return <EditionScrollHandler {...props}>{children}</EditionScrollHandler>;
  }
};

const EditionScrollHandler = ({
  children,
  ...props
}: CardModuleEditionScrollHandlerProps) => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const clone = isValidElement(children)
    ? cloneElement(children, { scrollPosition: scrollY })
    : children;

  return (
    <Animated.ScrollView bounces={false} onScroll={scrollHandler} {...props}>
      {clone}
    </Animated.ScrollView>
  );
};

export default CardModuleEditionScrollHandler;
