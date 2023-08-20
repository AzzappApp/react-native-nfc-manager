import {
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomMenu from '#ui/BottomMenu';
import { useRouter } from './NativeRouter';
import type { FooterBarItem } from '#ui/FooterBar';

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
  const { width } = useWindowDimensions();
  const bottom = inset.bottom > 0 ? inset.bottom : 10;
  return (
    <BottomMenu
      style={[
        {
          bottom,
          position: 'absolute',
          left: MARGIN_HORIZONTAL,
          width: width - 2 * MARGIN_HORIZONTAL,
        },
        style,
      ]}
      currentTab={['HOME', 'MEDIA'][currentIndex]}
      iconSize={28}
      tabs={TABS}
      onItemPress={onItemPress}
      showLabel
      showCircle={false}
    />
  );
};

const MARGIN_HORIZONTAL = 30;

const TABS: FooterBarItem[] = [
  {
    key: 'HOME',
    label: 'Webcards',
    icon: 'home',
  },
  {
    key: 'NEW_POST',
    label: 'New Post',
    icon: 'add_filled',
  },
  {
    key: 'MEDIA',
    label: 'Media',
    icon: 'media',
  },
];

export default MainTabBar;
