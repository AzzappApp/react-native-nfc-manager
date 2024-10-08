import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import {
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { profileHasEditorRight } from '@azzapp/shared/profileHelpers';
import { logEvent } from '#helpers/analytics';
import { getAuthState } from '#helpers/authStore';
import { createId } from '#helpers/idHelpers';
import useAuthState from '#hooks/useAuthState';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomMenu from '#ui/BottomMenu';
import Text from '#ui/Text';
import { HomeIcon } from './HomeIcon';
import {
  useNativeNavigationEvent,
  useRouter,
  useScreenHasFocus,
} from './NativeRouter';
import type { SharedValue } from 'react-native-reanimated';

const mainTabBarVisibilityStates: Array<{
  id: string;
  state: SharedValue<number> | false | true;
}> = [];

const mainTabBarVisibleListeners = new Set<() => void>();
export const useMainTabBarVisibilityController = (
  visibilityState: SharedValue<number> | false | true,
  active = true,
) => {
  const hasFocus = useScreenHasFocus();
  const [controlVisibility, setControlVisibility] = useState(hasFocus);

  const id = useMemo(() => createId(), []);

  useNativeNavigationEvent('disappear', () => {
    setControlVisibility(false);
  });

  useNativeNavigationEvent('willAppear', () => {
    setControlVisibility(true);
  });
  useLayoutEffect(() => {
    if (controlVisibility && active) {
      mainTabBarVisibilityStates.push({ id, state: visibilityState });
      mainTabBarVisibleListeners.forEach(listener => listener());
    }
    return () => {
      const index = mainTabBarVisibilityStates.findIndex(
        item => item.id === id,
      );
      if (index !== -1) {
        mainTabBarVisibilityStates.splice(index, 1);
        mainTabBarVisibleListeners.forEach(listener => listener());
      }
    };
  }, [controlVisibility, id, visibilityState, active]);
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

  const insets = useScreenInsets();
  const { width } = useWindowDimensions();

  const [, forceUpdate] = useState(0);

  const { authenticated } = useAuthState();

  const visibilityState =
    mainTabBarVisibilityStates.at(-1)?.state ?? authenticated;

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

  const intl = useIntl();

  const onItemPress = useCallback(
    (key: string) => {
      const hasFinishedTransition =
        visibilityState === true ||
        (visibilityState as SharedValue<number>).value > 0.99;

      if (!hasFinishedTransition) return;

      const { profileInfos } = getAuthState();

      if (
        key !== 'NEW_POST' ||
        profileHasEditorRight(profileInfos?.profileRole)
      ) {
        logEvent('create_post', { source: 'tab' });
        router.push({ route: key as any });
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Your role does not permit this action',
            description: 'Error message when trying to create a post',
          }),
        });
      }
    },
    [intl, router, visibilityState],
  );

  useEffect(() => {
    const listener = () => {
      forceUpdate(v => v + 1);
    };
    mainTabBarVisibleListeners.add(listener);
    return () => {
      mainTabBarVisibleListeners.delete(listener);
    };
  }, []);

  const tabs = useMemo(
    () =>
      [
        {
          key: 'HOME',
          label: intl.formatMessage(
            {
              defaultMessage: 'Webcards{azzappA}',
              description: 'Main tab bar title for webcards',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ),
          IconComponent: <HomeIcon />,
        },
        {
          key: 'NEW_POST',
          label: intl.formatMessage({
            defaultMessage: 'New Post',
            description: 'Main tab bar title for new post',
          }),
          icon: 'add_filled',
        },
        {
          key: 'MEDIA',
          label: intl.formatMessage({
            defaultMessage: 'Media',
            description: 'Main tab bar title for media',
          }),
          icon: 'media',
        },
      ] as const,
    [intl],
  );

  return (
    <Animated.View
      style={[
        {
          left: 0,
          bottom: 0,
          paddingBottom: insets.bottom,
          position: 'absolute',
          paddingLeft: MARGIN_HORIZONTAL,
          paddingRight: MARGIN_HORIZONTAL,
          width,
        },
        visibilityStyle,
        style,
      ]}
      animatedProps={animatedProps}
    >
      <BottomMenu
        currentTab={['HOME', 'MEDIA'][currentIndex]}
        iconSize={28}
        tabs={tabs}
        onItemPress={onItemPress}
        showLabel
        showCircle={false}
      />
    </Animated.View>
  );
};

const MARGIN_HORIZONTAL = 30;

export default MainTabBar;
