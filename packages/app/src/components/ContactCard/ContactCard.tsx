import {
  BlendColor,
  Canvas,
  ColorMatrix,
  Group,
  ImageSVG,
  OpacityMatrix,
  Paint,
  Skia,
  fitbox,
  rect,
  useSVG,
} from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import type { ContactCard_profile$key } from '#relayArtifacts/ContactCard_profile.graphql';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

type ContactCardProps = {
  profile: ContactCard_profile$key;
  style?: StyleProp<ViewStyle>;
  height: number;
  withRotationArrows?: boolean;
};

const ContactCard = ({
  profile: profileKey,
  height,
  style,
  withRotationArrows = false,
}: ContactCardProps) => {
  const { contactCard, contactCardQrCode, webCard } = useFragment(
    graphql`
      fragment ContactCard_profile on Profile
      @argumentDefinitions(
        width: { type: "Int!", provider: "qrCodeWidth.relayprovider" }
      ) {
        webCard {
          userName
          cardColors {
            primary
          }
          isMultiUser
          commonInformation {
            company
          }
        }
        contactCard {
          firstName
          lastName
          title
          company
        }
        contactCardQrCode(width: $width)
      }
    `,
    profileKey,
  );

  return (
    <ContactCardComponent
      webCard={webCard}
      height={height}
      style={style}
      withRotationArrows={withRotationArrows}
      contactCard={contactCard}
      contactCardQrCode={contactCardQrCode}
    />
  );
};

type WebCard = {
  readonly cardColors: {
    readonly primary: string;
  } | null;
  readonly commonInformation: {
    readonly company: string | null;
  } | null;
  readonly isMultiUser: boolean;
  readonly userName: string;
};

type ContactCard = {
  readonly company: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly title: string | null;
};

type ContactCardComponentProps = {
  webCard?: WebCard | null;
  height: number;
  style?: StyleProp<ViewStyle>;
  withRotationArrows?: boolean;
  contactCard?: ContactCard | null;
  contactCardQrCode?: string;
};

export const ContactCardComponent = ({
  webCard,
  height,
  style,
  withRotationArrows = false,
  contactCard,
  contactCardQrCode,
}: ContactCardComponentProps) => {
  const { userName, cardColors, commonInformation, isMultiUser } =
    webCard ?? {};

  const styles = useStyleSheet(stylesheet);
  const rotateArrowLeft = useSVG(require('#assets/rotateArrowLeft.svg'));
  const rotateArrowRight = useSVG(require('#assets/rotateArrowRight.svg'));

  const backgroundColor = cardColors?.primary ?? colors.black;

  const readableColor = useMemo(
    () => getTextColor(backgroundColor),
    [backgroundColor],
  );

  const company = useMemo(() => {
    if (isMultiUser) {
      return commonInformation?.company || contactCard?.company;
    } else {
      return contactCard?.company;
    }
  }, [commonInformation?.company, contactCard?.company, isMultiUser]);

  const svg = contactCardQrCode
    ? Skia.SVG.MakeFromString(contactCardQrCode)
    : null;

  const src = rect(0, 0, svg?.width() ?? 0, svg?.height() ?? 0);
  const dst = rect(15, 15, 80, 80);

  const layoutWidth = useSharedValue(0);

  const onTextLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    layoutWidth.value = nativeEvent.layout.width - 40; // remove the margins
  };

  const animatedFooterWidth = useAnimatedStyle(
    () => ({ width: layoutWidth.value }),
    [],
  );

  if (!contactCard || !webCard) {
    return null;
  }

  return (
    <View
      style={[
        styles.webCardContainer,
        {
          backgroundColor,
          height,
          borderRadius: height * CONTACT_CARD_RADIUS_HEIGHT,
        },
        style,
      ]}
    >
      <View
        onLayout={onTextLayout}
        style={[
          styles.webCardBackground,
          {
            height,
            borderRadius: height * CONTACT_CARD_RADIUS_HEIGHT,
          },
        ]}
      >
        <Image
          source={require('#assets/webcard/logo-substract.png')}
          style={[
            styles.logo,
            {
              height,
              width: 0.74 * height,
            },
          ]}
          resizeMode="contain"
        />
        <Image
          source={require('#assets/webcard/background.png')}
          style={[
            styles.webCardBackgroundImage,
            { width: 1.37 * height, height },
          ]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.firstLineView}>
          <Image
            source={require('#assets/logo-full_white.png')}
            resizeMode="contain"
            style={[styles.azzappImage, { tintColor: readableColor }]}
          />
        </View>

        <View style={styles.webCardContent}>
          <View style={styles.webcardText}>
            <Text
              variant="large"
              style={[
                styles.webCardLabel,
                { color: readableColor, fontSize: 14 },
              ]}
              numberOfLines={1}
            >
              {formatDisplayName(contactCard?.firstName, contactCard?.lastName)}
            </Text>
            {contactCard.title && (
              <Text
                variant="small"
                style={[styles.webCardLabel, { color: readableColor }]}
              >
                {contactCard.title}
              </Text>
            )}
            {company && (
              <Text
                variant="large"
                style={[styles.webCardLabel, { color: readableColor }]}
              >
                {company}
              </Text>
            )}
          </View>
        </View>
        <Animated.View style={[styles.webCardFooter, animatedFooterWidth]}>
          {userName && (
            <Text
              variant="xsmall"
              numberOfLines={1}
              style={[
                styles.webCardLabel,
                { opacity: 0.5, color: readableColor },
              ]}
            >
              {buildUserUrl(userName)}
            </Text>
          )}
        </Animated.View>
      </View>
      <View style={styles.qrCodeContainer}>
        {svg ? (
          <Canvas style={styles.qrCodeCanvas}>
            {withRotationArrows && (
              <Group
                layer={
                  <Paint>
                    <BlendColor color={readableColor} mode="srcATop" />
                    <ColorMatrix matrix={OpacityMatrix(0.5)} />
                  </Paint>
                }
              >
                <ImageSVG x={90} y={3} svg={rotateArrowLeft} />
                <ImageSVG x={7} y={95} svg={rotateArrowRight} />
              </Group>
            )}
            <Group
              layer={
                <Paint>
                  <BlendColor color={readableColor} mode="srcATop" />
                </Paint>
              }
              transform={fitbox('contain', src, dst)}
            >
              <ImageSVG svg={svg} />
            </Group>
          </Canvas>
        ) : null}
      </View>
    </View>
  );
};

export const CONTACT_CARD_RATIO = 1 / 0.6;
export const CONTACT_CARD_RADIUS_HEIGHT = 1 / 10;
// use in list on HomeScreen
export default memo(ContactCard);
export const CONTACT_CARD_ASPECT_RATIO = 0.6;

const stylesheet = createStyleSheet(appearance => ({
  webCardContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    aspectRatio: CONTACT_CARD_RATIO,
    overflow: 'visible',
    flexDirection: 'row',
    borderCurve: 'continuous',
    ...shadow(appearance),
  },
  logo: { zIndex: 1 },
  webCardBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    bottom: 0,
    borderCurve: 'continuous',
  },
  webCardBackgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  webCardContent: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    rowGap: 10,
  },
  webCardLabel: { color: colors.white },
  webCardFooter: {
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  webcardText: {
    flexDirection: 'column',
    height: '100%',
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    rowGap: 5,
  },
  qrCodeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  editButtonText: {
    fontSize: 14,
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 20,
  },
  editButtonContainer: {
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF4D',
    borderRadius: 78,
    width: 70,
    ...shadow('light', 'center'),
    overflow: 'visible',
  },
  firstLineView: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  azzappImage: {
    width: 85,
    position: 'absolute',
    left: 0,
    top: 3,
  },
  qrCodeCanvas: {
    width: 110,
    height: 110,
  },
}));
