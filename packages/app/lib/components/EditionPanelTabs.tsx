import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

type EditionPanelTabsProps = {
  currentTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    key: string;
    icon: ImageSourcePropType;
    accessibilityLabel: string;
  }>;
  style?: StyleProp<ViewStyle>;
};

const EditionPanelTabs = ({
  currentTab,
  tabs,
  onTabChange,
  style,
}: EditionPanelTabsProps) => (
  <View style={[styles.container, style]} accessibilityRole="tablist">
    {tabs.map(({ key, icon, accessibilityLabel }, index) => (
      <Pressable
        key={key}
        style={({ pressed }) => [
          styles.tab,
          (pressed || currentTab === key) && styles.tabActive,
          index !== tabs.length - 1 && { marginRight: 20 },
        ]}
        accessibilityRole="tab"
        accessibilityLabel={accessibilityLabel}
        onPress={() => onTabChange(key)}
      >
        {({ pressed }) => (
          <Image
            source={icon}
            style={[
              styles.image,
              (pressed || currentTab === key) && styles.imageActive,
            ]}
          />
        )}
      </Pressable>
    ))}
  </View>
);

export default EditionPanelTabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  tab: {
    width: 50,
    height: 50,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'white',
  },
  image: {
    tintColor: 'white',
    height: 18,
  },
  imageActive: {
    tintColor: '#000',
  },
});
