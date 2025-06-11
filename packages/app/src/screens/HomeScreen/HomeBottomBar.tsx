import { Canvas, Path, Skia, RadialGradient } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeBottomBar_shareButton_user$key } from '#relayArtifacts/HomeBottomBar_shareButton_user.graphql';
import type { HomeBottomBar_user$key } from '#relayArtifacts/HomeBottomBar_user.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

const BAR_HEIGHT = 82.86;
const ORIGINAL_WIDTH = 375;

type HomeBottomBarProps = {
  user: HomeBottomBar_shareButton_user$key | HomeBottomBar_user$key;
};

export const HomeBottomBar = ({ user: userKey }: HomeBottomBarProps) => {
  const user = useFragment(
    graphql`
      fragment HomeBottomBar_user on User {
        nbContactNotifications
      }
    `,
    userKey as HomeBottomBar_user$key,
  );
  const { bottomContentOpacity } = useHomeScreenContext();
  const { width } = useScreenDimensions();
  const { bottom } = useScreenInsets();
  const router = useRouter();

  const onPressScan = useCallback(() => {
    router.push({
      route: 'CONTACT_CREATE',
      params: {
        showCardScanner: true,
      },
    });
  }, [router]);

  const onPressContacts = useCallback(() => {
    router.push({ route: 'CONTACTS' });
  }, [router]);

  // The original path's X coordinates range from 0 to 375.
  // To center the dip, calculate the horizontal offset:
  const offset = (width - ORIGINAL_WIDTH) / 2;

  const path = Skia.Path.Make();
  if (path) {
    // Right section of the shape
    path.moveTo(width, 0);
    path.lineTo(width, 64.8633);
    path.cubicTo(
      width,
      74.8044,
      366.941 + offset,
      BAR_HEIGHT,
      357 + offset,
      BAR_HEIGHT,
    );
    path.lineTo(188 + offset, BAR_HEIGHT);
    path.lineTo(188 + offset, 38.8584);
    path.cubicTo(
      204.953 + offset,
      38.6816,
      220.051 + offset,
      29.5237,
      228.281 + offset,
      15.5654,
    );
    path.cubicTo(
      233.191 + offset,
      7.23949,
      241.092 + offset,
      0,
      250.758 + offset,
      0,
    );
    path.lineTo(width, 0);
    path.close();

    // Left section of the shape
    path.moveTo(124.242 + offset, 0);
    path.cubicTo(
      133.908 + offset,
      0,
      141.809 + offset,
      7.23949,
      146.719 + offset,
      15.5654,
    );
    path.cubicTo(
      154.787 + offset,
      29.2487,
      169.455 + offset,
      38.32,
      186 + offset,
      38.8389,
    );
    path.lineTo(186 + offset, BAR_HEIGHT);
    path.lineTo(0, BAR_HEIGHT);
    path.cubicTo(8.05888, BAR_HEIGHT, 0, 74.8044, 0, 64.8633);
    path.lineTo(0, 0);
    path.lineTo(124.242 + offset, 0);
    path.close();
  }

  const centerX = width / 2;
  const centerY = 0;
  const yRadius = BAR_HEIGHT + 20;
  const xRadius = (width / 2) * 1.4;
  const scaleX = xRadius / yRadius;

  const matrix = Skia.Matrix();
  matrix.scale(scaleX, 1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: bottomContentOpacity.value,
      pointerEvents:
        Math.round(bottomContentOpacity.value) === 1 ? 'auto' : 'none',
    };
  });

  return (
    <View style={[styles.container, { height: bottom + 46 }]}>
      <Animated.View style={[animatedStyle, { height: bottom + 46 }]}>
        <Canvas style={{ flex: 1 }}>
          {/* Elliptical radial gradient overlay */}
          <Path path={path} style="fill" opacity={0.15}>
            <RadialGradient
              c={{ x: centerX / scaleX, y: centerY }}
              r={yRadius}
              colors={[colors.white, colors.white, '#FFFFFF26']}
              positions={[0, 0.2, 1]}
              mode="clamp"
              matrix={matrix}
            />
          </Path>
          {/* Crisp 1px white inner stroke */}
          <Path
            path={path}
            style="stroke"
            strokeWidth={1}
            color="rgba(255,255,255,0.05)"
            strokeJoin="round"
          />
        </Canvas>

        <Pressable
          onPress={onPressScan}
          style={[styles.scanbutton, { width: width / 2 - 50 }]}
        >
          <Icon icon="scan" size={24} style={styles.iconWhite} />
          <Text variant="small" style={styles.textWhite}>
            <FormattedMessage
              defaultMessage="Scan"
              description="Home Bottom Bar - Scan"
            />
          </Text>
        </Pressable>
        <Pressable
          onPress={onPressContacts}
          style={[styles.contactbutton, { width: width / 2 - 50 }]}
        >
          <View style={styles.contactButtonContainer}>
            <Icon icon="contact" size={24} style={styles.iconWhite} />
            {user.nbContactNotifications > 0 && (
              <View style={styles.newContactsBadge}>
                <Text
                  variant="xxsmallextrabold"
                  style={styles.notificationText}
                >
                  {user.nbContactNotifications}
                </Text>
              </View>
            )}
            <Text variant="small" style={styles.textWhite}>
              <FormattedMessage
                defaultMessage="Contacts"
                description="Home Bottom Bar - Contacts"
              />
            </Text>
          </View>
        </Pressable>
      </Animated.View>
      <ShareButton
        userKey={userKey as HomeBottomBar_shareButton_user$key}
        animatedStyle={animatedStyle}
      />
    </View>
  );
};
const CIRCLE_SIZE = 69;
const styles = StyleSheet.create({
  contactButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: { color: colors.white },
  textWhite: { color: 'white' },
  iconBlack: { tintColor: 'black' },
  iconWhite: { tintColor: 'white', marginTop: 5 },
  scanbutton: {
    position: 'absolute',
    height: BAR_HEIGHT - 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  contactbutton: {
    position: 'absolute',
    height: BAR_HEIGHT - 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    right: 0,
  },
  newContactsBadge: {
    position: 'absolute',
    top: 4,
    left: 38,
    width: 21,
    height: 18,
    borderRadius: 27,
    backgroundColor: colors.red400,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerviewButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowOpacity: 0.44,
  },
  shareButton: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    top: -44,
    overflow: 'visible',
  },
  internalGradient: {
    width: CIRCLE_SIZE - 8,
    aspectRatio: 1,
    borderRadius: (CIRCLE_SIZE - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalGradient: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    marginTop: 15,
    overflow: 'visible',
  },
  circleShadow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14.6,
    overflow: 'visible',
  },
  circleShadow2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    overflow: 'visible',
  },
});

// Note : This structure can be strange, but it's the only way to make the share button work on anroid where the boutton outside of its parent
// the animated view, in this case, but not in another similar case on new home, cause issue with overflow android
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ShareButton = ({
  userKey,
  animatedStyle,
}: {
  userKey: HomeBottomBar_shareButton_user$key;
  animatedStyle: StyleProp<ViewStyle>;
}) => {
  const user = useFragment(
    graphql`
      fragment HomeBottomBar_shareButton_user on User {
        profiles {
          webCard {
            cardColors {
              primary
            }
          }
        }
      }
    `,
    userKey,
  );

  const { width } = useScreenDimensions();
  const router = useRouter();

  const onPressShare = useCallback(() => {
    router.push({ route: 'SHAKE_AND_SHARE' });
  }, [router]);

  const { currentIndexSharedValue } = useHomeScreenContext();
  const primaryColors =
    user.profiles?.map(
      profile => profile.webCard?.cardColors?.primary ?? 'transparent',
    ) ?? [];

  const animatedShadowStyle = useAnimatedStyle(() => {
    // Clamp index to valid range
    const data = ['transparent', ...primaryColors];

    const color = interpolateColor(
      currentIndexSharedValue.value,
      data.map((_, i) => i),
      data,
    );
    return {
      shadowColor: color,
    };
  });

  return (
    <AnimatedPressable
      style={[
        { left: (width - CIRCLE_SIZE) / 2 },
        styles.shareButton,
        styles.circleShadow2,
        animatedStyle,
      ]}
      onPress={onPressShare}
    >
      <Animated.View
        style={[
          styles.innerviewButton,
          styles.circleShadow,
          animatedShadowStyle,
        ]}
      >
        <LinearGradient
          colors={['#F5F5F6', '#FFF']}
          locations={[0.5192, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.externalGradient}
        >
          <LinearGradient
            colors={['#FFF', '#E2E1E3']}
            locations={[0.5192, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.internalGradient}
          >
            <Icon icon="share_home" size={30} style={styles.iconBlack} />
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
};
