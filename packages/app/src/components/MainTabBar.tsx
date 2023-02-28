import { useRouter } from '#PlatformEnvironment';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';
import TabsBar from '#ui/TabsBar';
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
          label: 'Home',
          icon: 'home',
        },
        {
          key: 'SEARCH',
          label: 'Search',
          icon: 'search',
        },
        {
          key: 'NEW_POST',
          label: 'New Post',
          icon: 'add',
        },
        {
          key: 'CHAT',
          label: 'Chat',
          icon: 'chat',
        },
        {
          key: 'SETTINGS',
          label: 'Settings',
          icon: 'account',
          tint: false,
        },
      ]}
      onTabPress={onTabPress}
    />
  );
};

export default MainTabBar;
