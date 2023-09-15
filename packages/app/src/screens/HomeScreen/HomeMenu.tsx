import { FormattedMessage } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { colors } from '#theme';
import TabBarMenuItem from '#ui/TabBarMenuItem';

export type HOME_TAB = 'CONTACT_CARD' | 'INFORMATION' | 'STATS';

type HomeMenuProps = {
  selected: HOME_TAB;
  setSelected: (section: HOME_TAB) => void;
};

const HomeMenu = ({ selected, setSelected }: HomeMenuProps) => {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      <TabBarMenuItem
        selected={selected === 'CONTACT_CARD'}
        setSelected={() => setSelected('CONTACT_CARD')}
        selectedBackgroundColor={END_GRADIENT_COLOR}
        backgroundColor={CLEAR_GRADIENT_COLOR}
        labelStyle={styles.menuLabelStyle}
        selectedLabelColor={colors.white}
      >
        <FormattedMessage
          defaultMessage="Contact card"
          description="Home Screen menu - Contact Card"
        />
      </TabBarMenuItem>
      <TabBarMenuItem
        selected={selected === 'STATS'}
        setSelected={() => setSelected('STATS')}
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
        setSelected={() => setSelected('INFORMATION')}
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
    </View>
  );
};

const HOME_MENU_PADDING = 10;
export const HOME_MENU_HEIGHT = 32 + HOME_MENU_PADDING;
export default HomeMenu;

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
    color: 'white',
  },
});
