import { useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import ContactCard, { CONTACT_CARD_RATIO } from '#components/ContactCard';
import { MENU_HEIGHT } from './HomeMenu';
import type { ContactCard_profile$key } from '@azzapp/relay/artifacts/ContactCard_profile.graphql';

type HomeContactCardLandscapeProps = {
  /**
   * The height of the contact card container in portrait mode
   *
   * @type {number}
   */
  containerHeight: number;
  profile: ContactCard_profile$key;
  /**
   * the animation orientation shared value
   *
   * @type {Animated.SharedValue<number>}
   */
  orientationTimer: Animated.SharedValue<number>;
};

const HomeContactCardLandscape = ({
  containerHeight,
  profile,
  orientationTimer,
}: HomeContactCardLandscapeProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 20;
  const animatedCard = useAnimatedStyle(() => {
    return {
      left: 10,
      top: (cardWidth * CONTACT_CARD_RATIO) / 2,
      zIndex: 100,
      opacity: interpolate(
        orientationTimer.value,
        [-90, -1, 1, 90],
        [1, 0, 0, 1],
      ),
      transform: [
        {
          translateY: interpolate(
            orientationTimer.value,
            [-90, -1, 1, 90],
            [
              0,
              4 * containerHeight -
                (cardWidth * CONTACT_CARD_RATIO) / 2 +
                20 +
                MENU_HEIGHT,
              4 * containerHeight -
                (cardWidth * CONTACT_CARD_RATIO) / 2 +
                20 +
                MENU_HEIGHT,
              0,
            ],
          ),
        },
        {
          rotate: `${interpolate(
            orientationTimer.value,
            [-90, -45, 45, 90],
            [90, 0, 0, 90],
          )}deg`,
        },
        {
          scale: interpolate(
            orientationTimer.value,
            [-90, -1, 0, 1, 90],
            [
              cardWidth / (cardWidth / CONTACT_CARD_RATIO),
              0.9,
              0,
              0.9,
              cardWidth / (cardWidth / CONTACT_CARD_RATIO),
            ],
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute' }, animatedCard]}>
      <ContactCard profile={profile} height={cardWidth / CONTACT_CARD_RATIO} />
    </Animated.View>
  );
};

export default HomeContactCardLandscape;
