import { useRouter } from '../PlatformEnvironment';
import TabsBar from '../ui/TabsBar';

const MainTabBar = ({ currentIndex }: { currentIndex: number }) => {
  const router = useRouter();
  const onTabPress = (tab: string) => {
    router.push({ route: tab as any });
  };
  return (
    <TabsBar
      currentTab={['HOME', 'SEARCH', 'CHAT', 'SETTINGS'][currentIndex]}
      tabs={[
        {
          key: 'HOME',
          accessibilityLabel: 'Picture Tab',
          icon: 'azzapp',
        },
        {
          key: 'SEARCH',
          accessibilityLabel: 'Search',
          icon: 'title',
        },
        {
          key: 'NEW_POST',
          accessibilityLabel: 'New Post',
          icon: 'flip',
        },
        {
          key: 'CHAT',
          accessibilityLabel: 'Chat',
          icon: 'effect',
        },
        {
          key: 'SETTINGS',
          accessibilityLabel: 'Setting',
          icon: 'desktop',
        },
      ]}
      onTabPress={onTabPress}
    />
  );
};

export default MainTabBar;
