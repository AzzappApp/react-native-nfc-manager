import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Canvas,
  Circle,
  LinearGradient,
  Paint,
  Path,
  Skia,
  Text,
  vec,
} from '@shopify/react-native-skia';
import concat from 'lodash/concat';
import React, { memo, Suspense, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Pressable, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useFragment, graphql } from 'react-relay';
import { convertHexToRGBA } from '@azzapp/shared/colorsHelpers';
import { useRouter } from '#components/NativeRouter';
import { useApplicationSkiaFont } from '#hooks/useApplicationFonts';
import RNText from '#ui/Text';
import { useIndexInterpolation } from './homeHelpers';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeInformations_user$key } from '#relayArtifacts/HomeInformations_user.graphql';
import type { IntlShape } from 'react-intl';
import type { ViewProps } from 'react-native';
import type { DerivedValue } from 'react-native-reanimated';

type HomeInformationsProps = {
  user: HomeInformations_user$key;
  height: number;
  width: number;
  notificationColor: DerivedValue<string>;
  nbNewContacts: DerivedValue<number>;
  newContactsOpacity: DerivedValue<number>;
};
/**
 *
 *
 * @param {HomeInformationsProps} {
 *   user,
 *   currentProfileIndexSharedValue,
 * }
 * @return {*}
 */
const HomeInformations = ({
  height,
  width,
  user,
  notificationColor,
  nbNewContacts,
  newContactsOpacity,
}: HomeInformationsProps) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeInformations_user on User {
        profiles {
          id
          nbContacts
          webCard {
            id
            userName
            firstName
            nbPosts
            nbFollowings
            nbFollowers
            nbPostsLiked
            coverIsPredefined
            cardColors {
              primary
            }
          }
        }
      }
    `,
    user,
  );

  const intl = useIntl();

  const { currentIndexProfileSharedValue, currentIndexSharedValue } =
    useHomeScreenContext();

  const nbPosts = useIndexInterpolation(
    currentIndexSharedValue,
    concat(0, profiles?.map(profile => profile.webCard?.nbPosts ?? 0) ?? []),
    0,
  );
  const nbPostsLabel = useDerivedValue(() => format(nbPosts.value));
  const computePostLabels = usePrecomputedLabels(intl, getPostsLabel);
  const postsLabel = useDerivedValue(() =>
    computePostLabels(Math.round(nbPosts.value)),
  );

  const nbLikes = useIndexInterpolation(
    currentIndexSharedValue,
    concat(
      0,
      profiles?.map(profile => profile.webCard?.nbPostsLiked ?? 0) ?? [],
    ),
    0,
  );
  const nbLikesLabel = useDerivedValue(() => format(nbLikes.value));
  const computeLikesLabels = usePrecomputedLabels(intl, getLikesLabel);
  const likesLabel = useDerivedValue(() =>
    computeLikesLabels(Math.round(nbLikes.value)),
  );

  const nbFollowers = useIndexInterpolation(
    currentIndexSharedValue,
    concat(
      0,
      profiles?.map(profile => profile.webCard?.nbFollowers ?? 0) ?? [],
    ),
    0,
  );
  const nbFollowersLabel = useDerivedValue(() => format(nbFollowers.value));
  const computeFollowersLabels = usePrecomputedLabels(intl, getFollowersLabel);
  const followersLabel = useDerivedValue(() =>
    computeFollowersLabels(Math.round(nbFollowers.value)),
  );

  const nbFollowings = useIndexInterpolation(
    currentIndexSharedValue,
    concat(
      0,
      profiles?.map(profile => profile.webCard?.nbFollowings ?? 0) ?? [],
    ),
    0,
  );
  const nbFollowingsLabel = useDerivedValue(() => format(nbFollowings.value));
  const computeFollowingsLabels = usePrecomputedLabels(intl, getFollowingLabel);
  const followingsLabel = useDerivedValue(() =>
    computeFollowingsLabels(Math.round(nbFollowings.value)),
  );

  const nbContacts = useIndexInterpolation(
    currentIndexSharedValue,
    concat(0, profiles?.map(profile => profile.nbContacts ?? 0) ?? []),
    0,
  );
  const nbContactsLabel = useDerivedValue(() => format(nbContacts.value));
  const computeContactsLabels = usePrecomputedLabels(intl, getContactsLabel);
  const contactsLabel = useDerivedValue(() =>
    computeContactsLabels(Math.round(nbContacts.value)),
  );

  const primaryColor = useIndexInterpolation<string>(
    currentIndexSharedValue,
    concat(
      '#000000',
      profiles?.map(
        profile => profile.webCard?.cardColors?.primary ?? '#000000',
      ) ?? [],
    ),
    '#000000',
    interpolateColor,
  );

  const router = useRouter();
  const goToPosts = useCallback(() => {
    const currentProfile = profiles?.[currentIndexProfileSharedValue.value - 1];
    if (currentProfile?.webCard?.coverIsPredefined) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage(
          {
            defaultMessage: 'You have to create your WebCard{azzappA} first',
            description:
              'Home screen - error message when trying to access posts without a webcard',
          },
          {
            azzappA: <RNText variant="azzapp">a</RNText>,
          },
        ) as unknown as string,
        visibilityTime: 2000,
      });
      return;
    }

    if (currentProfile?.webCard?.userName) {
      router.push({
        route: 'WEBCARD',
        params: {
          userName: currentProfile.webCard.userName,
          webCardId: currentProfile.webCard.id,
          showPosts: true,
        },
      });
    }
  }, [currentIndexProfileSharedValue.value, intl, profiles, router]);

  const goToLikedPost = useCallback(() => {
    router.push({
      route: 'LIKED_POSTS',
    });
  }, [router]);

  const goToFollowing = useCallback(() => {
    router.push({
      route: 'FOLLOWINGS',
    });
  }, [router]);

  const goToFollower = useCallback(() => {
    router.push({
      route: 'FOLLOWERS',
    });
  }, [router]);

  const goToContacts = useCallback(() => {
    router.push({
      route: 'CONTACTS',
    });
  }, [router]);

  const rectWidth = (width - RECT_BUTTON_GAP) / 2;
  const rectHeight = (height - RECT_BUTTON_GAP) / 2;
  const rightRowX = rectWidth + RECT_BUTTON_GAP;
  const bottomRowY = rectHeight + RECT_BUTTON_GAP;

  return (
    <View style={{ width, height }}>
      <Suspense fallback={null}>
        <InformationButtonRenderer
          x={0}
          y={0}
          width={rectWidth}
          height={rectHeight}
          value={nbPostsLabel}
          label={postsLabel}
          onPress={goToPosts}
          renderBackground={({ color, width, height }) => (
            <RectButtonBackground
              color={color}
              width={width}
              height={height}
              clipRadius={CONTACT_BUTTON_RADIUS + CENTER_BUTTON_GAP}
              clippedAngle="bottomRight"
              centerClipDelta={RECT_BUTTON_GAP / 2}
            />
          )}
        />
        <InformationButtonRenderer
          x={rightRowX}
          y={0}
          width={rectWidth}
          height={rectHeight}
          value={nbLikesLabel}
          label={likesLabel}
          onPress={goToLikedPost}
          renderBackground={({ color, width, height }) => (
            <RectButtonBackground
              color={color}
              width={width}
              height={height}
              clipRadius={CONTACT_BUTTON_RADIUS + CENTER_BUTTON_GAP}
              clippedAngle="bottomLeft"
              centerClipDelta={RECT_BUTTON_GAP / 2}
            />
          )}
        />
        <InformationButtonRenderer
          x={0}
          y={bottomRowY}
          width={rectWidth}
          height={rectHeight}
          value={nbFollowersLabel}
          label={followersLabel}
          onPress={goToFollower}
          renderBackground={({ color, width, height }) => (
            <RectButtonBackground
              color={color}
              width={width}
              height={height}
              clipRadius={CONTACT_BUTTON_RADIUS + CENTER_BUTTON_GAP}
              clippedAngle="topRight"
              centerClipDelta={RECT_BUTTON_GAP / 2}
            />
          )}
        />
        <InformationButtonRenderer
          x={rightRowX}
          y={bottomRowY}
          width={rectWidth}
          height={rectHeight}
          value={nbFollowingsLabel}
          label={followingsLabel}
          onPress={goToFollowing}
          renderBackground={({ color, width, height }) => (
            <RectButtonBackground
              color={color}
              width={width}
              height={height}
              clipRadius={CONTACT_BUTTON_RADIUS + CENTER_BUTTON_GAP}
              clippedAngle="topLeft"
              centerClipDelta={RECT_BUTTON_GAP / 2}
            />
          )}
        />

        <InformationButtonRenderer
          x={width / 2 - CONTACT_BUTTON_RADIUS}
          y={height / 2 - CONTACT_BUTTON_RADIUS}
          width={CONTACT_BUTTON_RADIUS * 2}
          height={CONTACT_BUTTON_RADIUS * 2}
          value={nbContactsLabel}
          label={contactsLabel}
          onPress={goToContacts}
          radius={CONTACT_BUTTON_RADIUS}
          renderBackground={({ color, width }) => (
            <CircleButtonBackground
              color={color}
              width={width}
              primaryColor={primaryColor}
              nbNewContacts={nbNewContacts}
              notificationColor={notificationColor}
              newContactsOpacity={newContactsOpacity}
            />
          )}
        />
      </Suspense>
    </View>
  );
};

export default memo(HomeInformations);

const RECT_BUTTON_GAP = 12;
const CENTER_BUTTON_GAP = 8;
const CONTACT_BUTTON_RADIUS = 43;
const BUTTON_RADIUS = 12;
const INNER_CURVE_RADIUS = 4;

const InformationButtonRenderer = ({
  value,
  label,
  x,
  y,
  width,
  height,
  radius = 12,
  onPress,
  renderBackground,
}: {
  value: DerivedValue<string>;
  label: DerivedValue<string>;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  onPress?: () => void;
  renderBackground: (args: {
    color: DerivedValue<string>;
    x: number;
    y: number;
    width: number;
    height: number;
  }) => React.ReactElement;
}) => {
  const valueFont = useApplicationSkiaFont(PlusJakartaSans_800ExtraBold, 20);
  const labelFont = useApplicationSkiaFont(PlusJakartaSans_400Regular, 12);

  const textsPosition = useDerivedValue(() => {
    const valueSize = valueFont.measureText(value.value);
    const labelSize = labelFont.measureText(label.value);
    const valueX = width / 2 - valueSize.width / 2;
    const labelX = width / 2 - labelSize.width / 2;

    return {
      valueX,
      labelX,
    };
  });

  const valueX = useDerivedValue(() => textsPosition.value.valueX);
  const labelX = useDerivedValue(() => textsPosition.value.labelX);

  const animatedButtonProps = useAnimatedProps<ViewProps>(() => ({
    'aria-label': ` ${value.value} ${label.value}`,
  }));
  const pressed = useSharedValue<number>(0);

  const color = useDerivedValue(() =>
    interpolateColor(
      pressed.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.18)', 'rgba(255, 255, 255, 0.4)'],
    ),
  );

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1);
  }, [pressed]);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0);
  }, [pressed]);

  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      role="button"
      accessible
      animatedProps={animatedButtonProps}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderRadius: radius,
      }}
    >
      <Canvas style={{ width, height }}>
        {renderBackground({
          color,
          x: 0,
          y: 0,
          width,
          height,
        })}
        <Text
          x={valueX}
          y={height / 2}
          text={value}
          font={valueFont}
          color="white"
        />
        <Text
          x={labelX}
          y={height / 2 + 20}
          text={label}
          font={labelFont}
          color="white"
        />
      </Canvas>
    </AnimatedPressable>
  );
};

const RectButtonBackground = ({
  color,
  width,
  height,
  clippedAngle,
  clipRadius,
  centerClipDelta = 0,
}: {
  color: DerivedValue<string>;
  width: number;
  height: number;
  clipRadius: number;
  clippedAngle: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  centerClipDelta?: number;
}) => {
  const path = Skia.Path.MakeFromSVGString(
    `
      M 0 ${-centerClipDelta + clipRadius + INNER_CURVE_RADIUS} 
      A ${INNER_CURVE_RADIUS} ${INNER_CURVE_RADIUS} 0 0 1 ${INNER_CURVE_RADIUS} ${-centerClipDelta + clipRadius} 
      A ${clipRadius},${clipRadius} 0 0 0 ${-centerClipDelta + clipRadius} ${INNER_CURVE_RADIUS}
      A ${INNER_CURVE_RADIUS} ${INNER_CURVE_RADIUS} 0 0 1 ${-centerClipDelta + clipRadius + INNER_CURVE_RADIUS} 0
      L ${width - BUTTON_RADIUS} 0 
      A ${BUTTON_RADIUS},${BUTTON_RADIUS} 0 0 1 ${width},${BUTTON_RADIUS} 
      L ${width},${height - BUTTON_RADIUS} 
      A ${BUTTON_RADIUS},${BUTTON_RADIUS} 0 0 1 ${width - BUTTON_RADIUS} ${height} 
      L ${BUTTON_RADIUS},${height} 
      A ${BUTTON_RADIUS},${BUTTON_RADIUS} 0 0 1 0 ${height - BUTTON_RADIUS} 
      L 0 ${BUTTON_RADIUS}
      Z
    `,
  );

  const transform = useMemo(() => {
    switch (clippedAngle) {
      case 'topLeft':
        return [];
      case 'topRight':
        return [{ scaleX: -1 }, { translateX: -width }];
      case 'bottomLeft':
        return [{ scaleY: -1 }, { translateY: -height }];
      case 'bottomRight':
        return [
          { scaleX: -1 },
          { scaleY: -1 },
          { translateX: -width },
          { translateY: -height },
        ];
    }
  }, [clippedAngle, height, width]);
  if (!path) {
    return null;
  }
  return <Path path={path} color={color} transform={transform} />;
};

const CircleButtonBackground = ({
  color,
  width,
  primaryColor,
  nbNewContacts,
  notificationColor,
  newContactsOpacity,
}: {
  color: DerivedValue<string>;
  width: number;
  primaryColor: DerivedValue<string>;
  nbNewContacts: DerivedValue<number>;
  notificationColor: DerivedValue<string>;
  newContactsOpacity: DerivedValue<number>;
}) => {
  const gradients = useDerivedValue(() => {
    if (primaryColor.value.startsWith('rgba')) {
      const opacity = parseInt(
        primaryColor.value[primaryColor.value.length - 2],
        10,
      );

      return [
        primaryColor.value,
        primaryColor.value.replace(`${opacity})`, `${opacity * 0.3})`),
      ];
    }

    return [
      convertHexToRGBA(primaryColor.value, 1),
      convertHexToRGBA(primaryColor.value, 0.3),
    ];
  });

  const notificationFont = useApplicationSkiaFont(
    PlusJakartaSans_800ExtraBold,
    11,
  );

  const nbNewContactsText = useDerivedValue(
    () => `+${format(nbNewContacts.value)}`,
  );

  const newContactTextPosition = useDerivedValue(() => {
    const textWidth = notificationFont.measureText(
      nbNewContactsText.value,
    ).width;
    return width / 2 - textWidth / 2;
  }, [width, nbNewContactsText]);

  return (
    <>
      <Circle
        r={width / 2}
        cx={width / 2}
        cy={width / 2}
        color={color}
        opacity={1}
      />
      <Circle r={width / 2 - 2} cx={width / 2} cy={width / 2} style="stroke">
        <Paint style="stroke" strokeWidth={1}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, width - 2)}
            colors={gradients}
          />
        </Paint>
      </Circle>
      <Text
        x={newContactTextPosition}
        y={width / 2 - 22}
        text={nbNewContactsText}
        font={notificationFont}
        color={notificationColor}
        opacity={newContactsOpacity}
      />
    </>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const format = (value: number) => {
  'worklet';
  if (typeof value === 'number') {
    return Math.round(value).toString();
  }
  return '0';
};

const usePrecomputedLabels = (
  intl: IntlShape,
  labelFormatter: (intl: IntlShape, isPlural: number) => string,
) => {
  const zeroLabel = labelFormatter(intl, 0);
  const oneLabel = labelFormatter(intl, 1);
  const otherLabel = labelFormatter(intl, 2);

  return useCallback(
    (value: number) => {
      'worklet';
      if (value === 0) {
        return zeroLabel;
      }
      if (value === 1) {
        return oneLabel;
      }
      return otherLabel;
    },
    [oneLabel, otherLabel, zeroLabel],
  );
};

const getPostsLabel = (intl: IntlShape, isPlural: number) =>
  intl.formatMessage(
    {
      defaultMessage: `{isPlural, plural,
        =0 {Posts}
        =1 {Post}
        other {Posts}
      }`,
      description: 'HomeScreen - information panel - Post label',
    },
    { isPlural },
  );

const getLikesLabel = (intl: IntlShape, isPlural: number) =>
  intl.formatMessage(
    {
      defaultMessage: `{isPlural, plural,
        =0 {Likes}
        =1 {Like}
        other {Likes}
      }`,
      description: 'HomeScreen - information panel - Likes label',
    },
    { isPlural },
  );

const getFollowersLabel = (intl: IntlShape, isPlural: number) =>
  intl.formatMessage(
    {
      defaultMessage: `{isPlural, plural,
        =0 {Followers}
        =1 {Follower}
        other {Followers}
      }`,
      description: 'HomeScreen - information panel - Followers label',
    },
    { isPlural },
  );

const getFollowingLabel = (intl: IntlShape, isPlural: number) =>
  intl.formatMessage(
    {
      defaultMessage: `{isPlural, plural,
        =0 {Following}
        =1 {Following}
        other {Following}
      }`,
      description: 'HomeScreen - information panel - Followings label',
    },
    { isPlural },
  );

const getContactsLabel = (intl: IntlShape, isPlural: number) =>
  intl.formatMessage(
    {
      defaultMessage: `{isPlural, plural,
          =0 {contacts}
          =1 {contact}
          other {contacts}
      }`,
      description:
        'HomeScreen - information panel - contacts label -- Note: the internal value is 0 for singular, 1 for plural ',
    },
    { isPlural },
  );
