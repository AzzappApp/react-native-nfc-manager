import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  Platform,
  useColorScheme,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  makeMutable,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors, fontFamilies, shadow } from '#theme';
import { getAuthState } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomMenu, { BOTTOM_MENU_PADDING } from '#ui/BottomMenu';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import { HomeIcon } from './HomeIcon';
import { useRouter } from './NativeRouter';
import { openShakeShare } from './ShakeShare';
import type { BottomMenuItem } from '#ui/BottomMenu';
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
        case 'SCAN':
          router.push({
            route: 'CONTACT_CREATE',
            params: {
              showCardScanner: true,
            },
          });

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
          label: intl.formatMessage({
            defaultMessage: 'Home',
            description: 'Main tab bar title for home',
          }),
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
          key: 'SCAN',
          label: intl.formatMessage({
            defaultMessage: 'Scan',
            description: 'Main tab bar title for scan',
          }),
          icon: 'scan',
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
  const styles = useStyleSheet(styleSheet);

  const renderScanButton = useCallback(
    (tab: BottomMenuItem) => {
      if (tab.key === 'SCAN') {
        const onPress = () => onItemPress(tab.key);
        return (
          <PressableNative
            testID={tab.key}
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={
              typeof tab.label === 'string' ? tab.label : undefined
            }
            onPress={onPress}
            style={styles.scanButton}
          >
            <LinearGradient
              colors={[
                'red', //rgba(200, 199, 202, 0.30)',
                'rgba(200, 199, 202, 0.00)',
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.linearGradient}
            />
            <Icon icon="scan" style={styles.icon} />
            <View style={styles.labelDecoration}>
              <Text variant="xsmall" style={styles.label}>
                {tab.label}
              </Text>
            </View>
          </PressableNative>
        );
      }
      return null;
    },
    [
      onItemPress,
      styles.icon,
      styles.label,
      styles.labelDecoration,
      styles.linearGradient,
      styles.scanButton,
    ],
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
          overflow: 'visible',
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
        renderCustomMenuItem={renderScanButton}
      />
    </Animated.View>
  );
};

const MARGIN_HORIZONTAL = 10;
export default MainTabBar;

const styleSheet = createStyleSheet(appearance => ({
  scanButton: {
    flex: 1,
    overflow: 'visible',
    minWidth: 50,
    borderRadius: 20,
    height: Platform.OS === 'ios' ? 62 : 70,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
    backgroundColor: appearance === 'light' ? colors.white : colors.grey1000,
    top: -5,
    ...shadow({
      appearance,
      direction: 'top',
      height: 15,
      forceOldShadow: true,
    }),
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  icon: {
    tintColor: appearance === 'light' ? colors.grey200 : colors.grey400,
    width: 24,
    height: 24,
  },
  linearGradient: {
    top: 2,
    marginHorizontal: 2,
    flex: 1,
    borderRadius: 18,
  },
  labelDecoration: {
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  label: {
    ...fontFamilies.semibold,
    lineHeight: 14,
    fontSize: 11,
    color: appearance === 'light' ? colors.grey300 : colors.grey500,
  },
}));
