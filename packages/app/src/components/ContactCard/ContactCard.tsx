import {
  BlendColor,
  Canvas,
  Group,
  ImageSVG,
  Paint,
  Skia,
  fitbox,
  rect,
} from '@shopify/react-native-skia';
import { memo, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Image, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors, shadow } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type {
  ContactCard_profile$data,
  ContactCard_profile$key,
} from '#relayArtifacts/ContactCard_profile.graphql';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type ContactCardProps = {
  profile: ContactCard_profile$key;
  style?: StyleProp<ViewStyle>;
  height: number;
  edit?: boolean;
  rotation?: SharedValue<number>;
};

const ContactCard = ({
  profile: profileKey,
  height,
  style,
  edit,
  rotation,
}: ContactCardProps) => {
  const { contactCard, contactCardQrCode, webCard, avatar } = useFragment(
    graphql`
      fragment ContactCard_profile on Profile
      @argumentDefinitions(
        width: { type: "Int!", provider: "qrCodeWidth.relayprovider" }
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
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
        avatar {
          id
          uri: uri(width: 112, pixelRatio: $pixelRatio)
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
      contactCard={contactCard}
      contactCardQrCode={contactCardQrCode}
      avatar={avatar}
      edit={edit}
      rotation={rotation}
    />
  );
};

type WebCard = ContactCard_profile$data['webCard'];
type ContactCard = ContactCard_profile$data['contactCard'];

type ContactCardComponentProps = {
  webCard?: WebCard | null;
  height: number;
  style?: StyleProp<ViewStyle>;
  contactCard?: ContactCard | null;
  contactCardQrCode?: string;
  avatar?: ContactCard_profile$data['avatar'];
  edit?: boolean;
  rotation?: SharedValue<number>;
};

export const ContactCardComponent = ({
  webCard,
  height,
  style,
  contactCard,
  contactCardQrCode,
  avatar,
  edit,
  rotation,
}: ContactCardComponentProps) => {
  const { userName, cardColors, commonInformation, isMultiUser } =
    webCard ?? {};

  const styles = useStyleSheet(stylesheet);
  const router = useRouter();

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

  const layoutWidth = useSharedValue(0);

  const onTextLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    layoutWidth.value = nativeEvent.layout.width - 40; // remove the margins
  };

  const animatedFooterWidth = useAnimatedStyle(() => ({
    width: layoutWidth.value,
  }));

  const avatarSource = useMemo(() => {
    if (avatar?.uri) {
      return {
        uri: avatar.uri,
        mediaId: avatar.id ?? '',
        requestedSize: 112,
      };
    }
    return null;
  }, [avatar?.id, avatar?.uri]);

  const qrCodeStyle = useAnimatedStyle(() => {
    const size = interpolate(
      rotation?.value ?? 0,
      [0, 1],
      [110, (layoutWidth.value / CONTACT_CARD_RATIO) * 0.8],
    );

    return {
      width: size,
      height: size,
    };
  });

  const transform = useDerivedValue(() => {
    const size = interpolate(
      rotation?.value ?? 0,
      [0, 1],
      [80, (layoutWidth.value / CONTACT_CARD_RATIO) * 0.8],
    );

    const origin = interpolate(rotation?.value ?? 0, [0, 1], [15, 0]);

    const dst = rect(origin, origin, size, size);

    return fitbox('contain', src, dst);
  });

  const onEdit = useCallback(() => {
    router.push({
      route: 'CONTACT_CARD_EDIT',
    });
  }, [router]);

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
        {!avatarSource && (
          <View style={styles.firstLineView}>
            <Image
              source={require('#assets/logo-full_white.png')}
              resizeMode="contain"
              style={[styles.azzappImage, { tintColor: readableColor }]}
            />
          </View>
        )}

        <View style={styles.webCardContent}>
          <View style={styles.webcardText}>
            {avatarSource && (
              <MediaImageRenderer source={avatarSource} style={styles.avatar} />
            )}
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
          <Animated.View style={qrCodeStyle}>
            <Canvas style={styles.qrCodeCanvas} opaque>
              <Group
                layer={
                  <Paint>
                    <BlendColor color={readableColor} mode="srcATop" />
                  </Paint>
                }
                transform={transform}
              >
                <ImageSVG svg={svg} />
              </Group>
            </Canvas>
          </Animated.View>
        ) : null}
        {edit && (
          <PressableNative
            style={[
              styles.edit,
              {
                backgroundColor: readableColor,
              },
            ]}
            onPress={onEdit}
          >
            <Icon
              icon="edit"
              size={17}
              style={{ tintColor: backgroundColor }}
            />
            <Text variant="button" style={{ color: backgroundColor }}>
              <FormattedMessage
                defaultMessage="Edit"
                description="ContactCard - Label for edit button"
              />
            </Text>
          </PressableNative>
        )}
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
    flex: 1,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 55,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: colors.white,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  edit: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 27,
    width: 80,
    paddingVertical: 5,
    gap: 5,
  },
}));
