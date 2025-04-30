import { cloneElement, isValidElement, useMemo, useRef } from 'react';

import { Animated } from 'react-native';
import type { ReactElement } from 'react';
import type { ScrollViewProps } from 'react-native';

type CardModuleEditionScrollHandlerProps = ScrollViewProps & {
  children: ReactElement<{ scrollPosition: Animated.Value }>;
  scrollPosition?: Animated.Value;
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
  const scrollPosition = useRef(new Animated.Value(0)).current;

  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollPosition } } }],
        { useNativeDriver: true },
      ),
    [scrollPosition],
  );

  const clone = isValidElement(children)
    ? cloneElement(children, { scrollPosition })
    : children;

  return (
    <Animated.ScrollView bounces={false} onScroll={onScroll} {...props}>
      {clone}
    </Animated.ScrollView>
  );
};

export default CardModuleEditionScrollHandler;
