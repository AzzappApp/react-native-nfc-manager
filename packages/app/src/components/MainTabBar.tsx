import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  makeMutable,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { profileHasEditorRight } from '@azzapp/shared/profileHelpers';
import { logEvent } from '#helpers/analytics';
import { getAuthState } from '#helpers/authStore';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomMenu from '#ui/BottomMenu';
import Text from '#ui/Text';
import { HomeIcon } from './HomeIcon';
import { useRouter } from './NativeRouter';

const mainTabBarOpacity = makeMutable(1);

/**
 * Set the opacity of the main tab bar.
 * This will not trigger a re-render of the component.
 *
 * @param opacity The opacity to set.
 */
export const setMainTabBarOpacity = (opacity: number) => {
  'worklet';
  mainTabBarOpacity.value = opacity;
};

/**
 * Retrieve the opacity of the main tab bar.
 *
 * @returns The opacity of the main tab bar.
 */
export const getMainTabBarOpacity = () => {
  'worklet';
  return mainTabBarOpacity.value;
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

  const visibilityStyle = useAnimatedStyle(() => {
    return {
      opacity: mainTabBarOpacity.value,
    };
  }, []);

  const animatedProps = useAnimatedProps((): {
    pointerEvents: 'auto' | 'box-none' | 'box-only' | 'none' | undefined;
  } => {
    const pointerEvents = mainTabBarOpacity?.value === 0 ? 'none' : 'box-none';

    return {
      pointerEvents,
    };
  }, []);

  const intl = useIntl();

  const onItemPress = useCallback(
    (key: string) => {
      const hasFinishedTransition = mainTabBarOpacity.value > 0.99;

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
    [intl, router],
  );

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
