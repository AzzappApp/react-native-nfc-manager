import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { ENABLE_MULTI_USER } from '#Config';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { profileInfoHasAdminRight } from '#helpers/profileRoleHelper';
import TabBarMenuItem from '#ui/TabBarMenuItem';
import Text from '#ui/Text';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeBottomPanel_user$data } from '#relayArtifacts/HomeBottomPanel_user.graphql';
import type { DerivedValue } from 'react-native-reanimated';

export type HOME_TAB = 'CONTACT_CARD' | 'MULTI_USER' | 'STATS';

type HomeMenuProps = {
  selected: HOME_TAB;
  user: HomeBottomPanel_user$data;
  setSelected: (section: HOME_TAB) => void;
  newContactsOpacity: DerivedValue<number>;
  notificationColor: DerivedValue<string>;
  minWidth: number;
};

const circleSize = 4.5;

const HomeMenu = ({
  user,
  selected,
  setSelected,
  newContactsOpacity,
  notificationColor,
  minWidth,
}: HomeMenuProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { currentIndexProfileSharedValue } = useHomeScreenContext();
  const circleAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: notificationColor.value,
      opacity: withTiming(newContactsOpacity.value, { duration: 300 }),
    };
  });

  const onPressMultiUser = useCallback(() => {
    const profile = user?.profiles?.[currentIndexProfileSharedValue.value - 1];
    if (!profile?.webCard?.isMultiUser || profileInfoHasAdminRight(profile)) {
      router.push({
        route: 'MULTI_USER',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'This action is outside your role permissions.',
          description:
            'Error toast message when try to access to the multi user page from home tabs menu',
        }),
      });
    }
  }, [currentIndexProfileSharedValue.value, intl, router, user?.profiles]);

  return (
    <View
      style={[styles.container, { width: minWidth }]}
      accessibilityRole="tablist"
    >
      <TabBarMenuItem
        selected={selected === 'CONTACT_CARD'}
        onPress={() => setSelected('CONTACT_CARD')}
        selectedBackgroundColor={END_GRADIENT_COLOR}
        backgroundColor={CLEAR_GRADIENT_COLOR}
        labelStyle={styles.menuLabelStyle}
        selectedLabelColor={colors.white}
      >
        <FormattedMessage
          defaultMessage="Contact card{azzappA}"
          description="Home Screen menu - Contact Card"
          values={{
            azzappA: (
              <Text variant="azzapp" style={styles.menuLabelStyle}>
                a
              </Text>
            ),
          }}
        />
      </TabBarMenuItem>
      {ENABLE_MULTI_USER && (
        <TabBarMenuItem
          selected={selected === 'MULTI_USER'}
          onPress={onPressMultiUser}
          selectedBackgroundColor={END_GRADIENT_COLOR}
          backgroundColor={CLEAR_GRADIENT_COLOR}
          labelStyle={styles.menuLabelStyle}
          selectedLabelColor={colors.white}
        >
          <FormattedMessage
            defaultMessage="Multi-user"
            description="Home Screen menu - Multi user"
          />
        </TabBarMenuItem>
      )}
      <TabBarMenuItem
        selected={selected === 'MULTI_USER'}
        onPress={onPressMultiUser}
        selectedBackgroundColor={END_GRADIENT_COLOR}
        backgroundColor={CLEAR_GRADIENT_COLOR}
        labelStyle={styles.menuLabelStyle}
        selectedLabelColor={colors.white}
      >
        <FormattedMessage
          defaultMessage="Multi-user"
          description="Home Screen menu - Multi user"
        />
      </TabBarMenuItem>
      <TabBarMenuItem
        selected={selected === 'STATS'}
        onPress={() => setSelected('STATS')}
        selectedBackgroundColor={END_GRADIENT_COLOR}
        backgroundColor={CLEAR_GRADIENT_COLOR}
        labelStyle={styles.menuLabelStyle}
        selectedLabelColor={colors.white}
      >
        <FormattedMessage
          defaultMessage="Statistics"
          description="Home Screen menu - Stats"
        />
      </TabBarMenuItem>

      <Animated.View style={[styles.circle, circleAnimatedStyle]} />
    </View>
  );
};

const HOME_MENU_PADDING = 10;
export const HOME_MENU_HEIGHT = 32 + HOME_MENU_PADDING;
export default memo(HomeMenu);

const CLEAR_GRADIENT_COLOR = 'rgba(255, 255, 255, 0)';
const END_GRADIENT_COLOR = 'rgba(255, 255, 255, 0.3)';

const styles = StyleSheet.create({
  container: {
    height: HOME_MENU_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: HOME_MENU_PADDING,
    overflow: 'visible',
    gap: 5,
    alignSelf: 'center',
  },
  menuLabelStyle: {
    color: colors.white,
  },
  circle: {
    width: circleSize * 2,
    height: circleSize * 2,
    borderRadius: circleSize,
    flex: 1,
    top: 4,
    right: 6,
    position: 'absolute',
  },
});
