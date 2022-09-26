import useViewportSize, { insetBottom } from '../hooks/useViewportSize';
import { useRouter } from '../PlatformEnvironment';
import TabsBar from '../ui/TabsBar';
import type { StyleProp, ViewStyle } from 'react-native';

const MainTabBar = ({
  currentIndex,
  style,
}: {
  currentIndex: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const router = useRouter();
  const onTabPress = (tab: string) => {
    router.push({ route: tab as any });
  };
  const vp = useViewportSize();
  return (
    <TabsBar
      style={[{ marginBottom: vp`${insetBottom}` }, style]}
      currentTab={['HOME', 'SEARCH', 'CHAT', 'SETTINGS'][currentIndex]}
      tabs={[
        {
          key: 'HOME',
          accessibilityLabel: 'Home',
          icon: 'home',
        },
        {
          key: 'SEARCH',
          accessibilityLabel: 'Search',
          icon: 'search',
        },
        {
          key: 'NEW_POST',
          accessibilityLabel: 'New Post',
          icon: 'add',
        },
        {
          key: 'CHAT',
          accessibilityLabel: 'Chat',
          icon: 'chat',
        },
        {
          key: 'SETTINGS',
          accessibilityLabel: 'Settings',
          icon: 'account',
          tint: false,
        },
      ]}
      onTabPress={onTabPress}
    />
  );
};

export default MainTabBar;
