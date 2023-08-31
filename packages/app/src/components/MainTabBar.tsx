import { useEffect, useMemo, useState } from 'react';
import {
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createId } from '#helpers/idHelpers';
import BottomMenu from '#ui/BottomMenu';
import {
  useNativeNavigationEvent,
  useRouter,
  useScreenHasFocus,
} from './NativeRouter';
import type { FooterBarItem } from '#ui/FooterBar';
import type { SharedValue } from 'react-native-reanimated';

const mainTabBarVisibilityStates: Array<{
  id: string;
  state: SharedValue<number> | false | true;
}> = [];

const mainTabBarVisibleListners = new Set<() => void>();
export const useMainTabBarVisiblilityController = (
  visibilityState: SharedValue<number> | false | true,
) => {
  const hasFocus = useScreenHasFocus();
  const [controlVisibility, setControlVisibility] = useState(hasFocus);

  useNativeNavigationEvent('disappear', () => {
    setControlVisibility(false);
  });

  useNativeNavigationEvent('willAppear', () => {
    setControlVisibility(true);
  });

  const id = useMemo(() => createId(), []);
  useEffect(() => {
    if (controlVisibility) {
      mainTabBarVisibilityStates.push({ id, state: visibilityState });
      mainTabBarVisibleListners.forEach(listener => listener());
    }
    return () => {
      const index = mainTabBarVisibilityStates.findIndex(
        item => item.id === id,
      );
      if (index !== -1) {
        mainTabBarVisibilityStates.splice(index, 1);
        mainTabBarVisibleListners.forEach(listener => listener());
      }
    };
  }, [controlVisibility, id, visibilityState]);
};

/**
 * The main tab bar of the app.
 */
const MainTabBar = ({
  currentIndex,
  style,
}: {
  currentIndex: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const router = useRouter();
  const onItemPress = (key: string) => {
    router.push({ route: key as any });
  };

  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bottom = inset.bottom > 0 ? inset.bottom : 10;

  const [visibilityState, setVisibilitySharedValue] = useState(
    mainTabBarVisibilityStates.at(-1)?.state ?? true,
  );

  const visibilityStyle = useAnimatedStyle(() => {
    const visible =
      visibilityState === true
        ? 1
        : visibilityState === false
        ? 0
        : visibilityState?.value;
    return {
      opacity: visible,
    };
  }, [visibilityState]);

  const animatedProps = useAnimatedProps((): {
    pointerEvents: 'auto' | 'box-none' | 'box-only' | 'none' | undefined;
  } => {
    const pointerEvents =
      visibilityState === true
        ? 'box-none'
        : visibilityState === false
        ? 'none'
        : visibilityState?.value === 0
        ? 'none'
        : 'box-none';

    return {
      pointerEvents,
    };
  }, [visibilityState]);

  useEffect(() => {
    const listener = () => {
      setVisibilitySharedValue(
        mainTabBarVisibilityStates.at(-1)?.state ?? true,
      );
    };
    mainTabBarVisibleListners.add(listener);
    return () => {
      mainTabBarVisibleListners.delete(listener);
    };
  }, []);

  return (
    <Animated.View
      style={[
        {
          bottom,
          position: 'absolute',
          left: MARGIN_HORIZONTAL,
          width: width - 2 * MARGIN_HORIZONTAL,
        },
        visibilityStyle,
        style,
      ]}
      animatedProps={animatedProps}
    >
      <BottomMenu
        currentTab={['HOME', 'MEDIA'][currentIndex]}
        iconSize={28}
        tabs={TABS}
        onItemPress={onItemPress}
        showLabel
        showCircle={false}
      />
    </Animated.View>
  );
};

const MARGIN_HORIZONTAL = 30;

const TABS: FooterBarItem[] = [
  {
    key: 'HOME',
    label: 'Webcards',
    icon: 'home',
  },
  {
    key: 'NEW_POST',
    label: 'New Post',
    icon: 'add_filled',
  },
  {
    key: 'MEDIA',
    label: 'Media',
    icon: 'media',
  },
];

export default MainTabBar;
