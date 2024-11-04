import { memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import TabBarMenuItem from '#ui/TabBarMenuItem';
import Text from '#ui/Text';
import type { DerivedValue } from 'react-native-reanimated';

export type HOME_TAB = 'CONTACT_CARD' | 'INFORMATION' | 'STATS';

type HomeMenuProps = {
  selected: HOME_TAB;
  setSelected: (section: HOME_TAB) => void;
  newContactsOpacity: DerivedValue<number>;
  notificationColor: DerivedValue<string>;
};

const circleSize = 4.5;

const HomeMenu = ({
  selected,
  setSelected,
  newContactsOpacity,
  notificationColor,
}: HomeMenuProps) => {
  const circleAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: notificationColor.value,
      opacity: withTiming(
        selected === 'INFORMATION' ? 0 : newContactsOpacity.value,
        { duration: 300 },
      ),
    };
  }, [selected]);

  return (
    <View style={styles.container} accessibilityRole="tablist">
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
      <TabBarMenuItem
        selected={selected === 'STATS'}
        onPress={() => setSelected('STATS')}
        selectedBackgroundColor={END_GRADIENT_COLOR}
        backgroundColor={CLEAR_GRADIENT_COLOR}
        labelStyle={styles.menuLabelStyle}
        selectedLabelColor={colors.white}
      >
        <FormattedMessage
          defaultMessage="Stats"
          description="Home Screen menu - Stats"
        />
      </TabBarMenuItem>
      <TabBarMenuItem
        selected={selected === 'INFORMATION'}
        onPress={() => setSelected('INFORMATION')}
        selectedBackgroundColor={END_GRADIENT_COLOR}
        backgroundColor={CLEAR_GRADIENT_COLOR}
        labelStyle={styles.menuLabelStyle}
        selectedLabelColor={colors.white}
      >
        <FormattedMessage
          defaultMessage="Information"
          description="Home Screen menu - Information"
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
    justifyContent: 'space-between',
    marginLeft: 20,
    marginRight: 20,
    paddingBottom: HOME_MENU_PADDING,
    overflow: 'visible',
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
