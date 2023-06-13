import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FooterBar from '#ui/FooterBar';
import { useRouter } from './NativeRouter';
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

  const inset = useSafeAreaInsets();

  return (
    <FooterBar
      style={[{ marginBottom: inset.bottom }, style]}
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
