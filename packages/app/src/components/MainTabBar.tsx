import { useRouter } from '#PlatformEnvironment';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';

import FooterBar from '#ui/FooterBar';
import type { FooterBarItem } from '#ui/FooterBar';
import type { StyleProp, ViewStyle } from 'react-native';

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
  const onItemPress = (key: string) => {
    router.push({ route: key as any });
  };
  const vp = useViewportSize();

  return (
    <FooterBar
      style={[{ marginBottom: vp`${insetBottom}` }, style]}
      currentTab={['HOME', 'SEARCH', 'CHAT', 'ALBUMS'][currentIndex]}
      iconSize={28}
      tabs={TABS}
      onItemPress={onItemPress}
      decoration="label"
    />
  );
};

const TABS: FooterBarItem[] = [
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
    label: 'Posts',
    icon: 'add_circle',
  },
  {
    key: 'CHAT',
    label: 'Messages',
    icon: 'chat',
  },
  {
    key: 'ALBUMS',
    label: 'Albums',
    icon: 'albums',
  },
];

export default MainTabBar;
