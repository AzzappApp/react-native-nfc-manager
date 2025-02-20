import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  useColorScheme,
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
import { colors } from '#theme';

import { getAuthState } from '#helpers/authStore';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomMenu, { BOTTOM_MENU_PADDING } from '#ui/BottomMenu';
import Text from '#ui/Text';
import { HomeIcon } from './HomeIcon';
import { useRouter } from './NativeRouter';
import { openShakeShare } from './ShakeShare';
import type { ReactNode } from 'react';

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

      switch (key) {
        case 'SHARE':
          openShakeShare();
          break;
        case 'MEDIA':
          {
            const { profileInfos } = getAuthState();
            let toastMessage: ReactNode[] | string | undefined = undefined;
            if (!profileInfos?.cardIsPublished) {
              toastMessage = intl.formatMessage(
                {
                  defaultMessage:
                    'Publish WebCard{azzappA} to browse community',
                  description:
                    'info toast when browsing community on an unpublished webcard',
                },
                {
                  azzappA: <Text variant="azzapp">a</Text>,
                },
              );
            }

            if (profileInfos?.invited) {
              toastMessage = intl.formatMessage({
                defaultMessage: 'Accept invitation to browse community',
                description:
                  'info toast when browsing community on an invit webcard',
              });
            }

            if (profileInfos?.coverIsPredefined) {
              toastMessage = intl.formatMessage({
                defaultMessage: 'Create a cover to browse community',
                description:
                  'info toast when browsing community on an predefined cover',
              });
            }

            if (toastMessage) {
              Toast.show({
                type: 'info',
                text1: toastMessage as string,
              });
            } else {
              router.push({ route: key as any });
            }
          }
          break;
        default:
          router.push({ route: key as any });
          break;
      }
    },
    [intl, router],
  );

  const appearance = useColorScheme() ?? 'light';

  const currentRoute = ['HOME', 'MEDIA'][currentIndex];

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
              azzappA: (
                <Text
                  variant="azzapp"
                  style={{
                    color:
                      currentRoute === 'HOME'
                        ? appearance === 'light'
                          ? colors.black
                          : colors.white
                        : appearance === 'light'
                          ? colors.grey200
                          : colors.grey400,
                  }}
                >
                  a
                </Text>
              ),
            },
          ),
          IconComponent: <HomeIcon />,
        },
        {
          key: 'SHARE',
          label: intl.formatMessage({
            defaultMessage: 'Share',
            description: 'Main tab bar title for share',
          }),
          icon: 'share_main',
        },
        {
          key: 'CONTACTS',
          label: intl.formatMessage({
            defaultMessage: 'Contacts',
            description: 'Main tab bar title for contacts',
          }),
          icon: 'contact',
        },
        {
          key: 'MEDIA',
          label: intl.formatMessage({
            defaultMessage: 'Community',
            description: 'Main tab bar title for community',
          }),
          icon: 'community',
        },
      ] as const,
    [intl, currentRoute, appearance],
  );

  return (
    <Animated.View
      style={[
        {
          left: 0,
          bottom: 0,
          paddingBottom: insets.bottom - BOTTOM_MENU_PADDING,
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
        currentTab={currentRoute}
        iconSize={24}
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
