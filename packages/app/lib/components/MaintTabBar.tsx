import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from '../PlatformEnvironment';
import TabsBar from '../ui/TabsBar';

const MainTabBar = ({ currentIndex }: { currentIndex: number }) => {
  const router = useRouter();
  const onTabPress = (tab: string) => {
    router.push({ route: tab as any });
  };
  const { bottom } = useSafeAreaInsets();
  return (
    <TabsBar
      style={{ marginBottom: bottom }}
      currentTab={['HOME', 'SEARCH', 'CHAT', 'SETTINGS'][currentIndex]}
      tabs={[
        {
          key: 'HOME',
          accessibilityLabel: 'Picture Tab',
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
          accessibilityLabel: 'Setting',
          icon: 'account',
          tint: false,
        },
      ]}
      onTabPress={onTabPress}
    />
  );
};

export default MainTabBar;
