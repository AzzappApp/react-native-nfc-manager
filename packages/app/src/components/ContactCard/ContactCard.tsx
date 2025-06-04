import { memo, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Image, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
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
import type { StyleProp, ViewStyle } from 'react-native';

type ContactCardProps = {
  profile: ContactCard_profile$key;
  style?: StyleProp<ViewStyle>;
  height: number;
  edit?: boolean;
};

const ContactCard = ({
  profile: profileKey,
  height,
  style,
  edit,
}: ContactCardProps) => {
  const data = useFragment(
    graphql`
      fragment ContactCard_profile on Profile
      @refetchable(queryName: "ContactCard_profileQuery")
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        webCard {
          cardColors {
            primary
          }
          isMultiUser
          commonInformation {
            company
            emails {
              label
              address
            }
            phoneNumbers {
              label
              number
            }
          }
        }
        contactCard {
          firstName
          lastName
          title
          company
          emails {
            label
            address
          }
          phoneNumbers {
            label
            number
          }
        }
        avatar {
          id
          uri: uri(width: 112, pixelRatio: $pixelRatio)
        }
      }
    `,
    profileKey,
  );

  const { contactCard, avatar, webCard } = data;

  const router = useRouter();
  const onEdit = useMemo(
    () =>
      edit
        ? () => {
            router.push({
              route: 'CONTACT_CARD_EDIT',
            });
          }
        : null,
    [edit, router],
  );

  return (
    <ContactCardComponent
      webCard={webCard}
      height={height}
      style={style}
      contactCard={contactCard}
      avatar={avatar}
      onEdit={onEdit}
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
  avatar?: ContactCard_profile$data['avatar'];
  onEdit?: (() => void) | null;
};
const REFERENCE_HEIGHT = 197;
export const ContactCardComponent = ({
  webCard,
  height,
  style,
  contactCard,
  avatar,
  onEdit: onEditProp,
}: ContactCardComponentProps) => {
  //define a ratio display based on the initial figma to keep the display consistend on different screen
  const ratioDisplay = height / REFERENCE_HEIGHT;

  const { cardColors, commonInformation, isMultiUser } = webCard ?? {};

  const styles = useStyleSheet(stylesheet);

  const backgroundColor = cardColors?.primary ?? colors.black;

  const readableColor = getTextColor(backgroundColor);

  const company = isMultiUser
    ? commonInformation?.company || contactCard?.company
    : contactCard?.company;

  const phone = isMultiUser
    ? (contactCard?.phoneNumbers?.[0]?.number ??
      commonInformation?.phoneNumbers?.[0]?.number ??
      null)
    : (contactCard?.phoneNumbers?.[0]?.number ?? null);

  const mail = isMultiUser
    ? (contactCard?.emails?.[0]?.address ??
      commonInformation?.emails?.[0]?.address ??
      null)
    : (contactCard?.emails?.[0]?.address ?? null);

  const avatarSource = avatar?.uri
    ? {
        uri: avatar.uri,
        mediaId: avatar.id ?? '',
        requestedSize: 112,
      }
    : null;

  const onEdit = useCallback(() => {
    onEditProp?.();
  }, [onEditProp]);

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
          paddingHorizontal: 20 * ratioDisplay,
        },
        style,
      ]}
    >
      <View
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
      <View style={styles.webCardContent}>
        <View
          style={[
            styles.avatarContainer,
            {
              maxHeight: 55 * ratioDisplay,
              minHeight: 55 * ratioDisplay,
              marginTop: 25 * ratioDisplay,
              marginBottom: 10,
            },
          ]}
        >
          {avatarSource ? (
            <MediaImageRenderer
              source={avatarSource}
              style={[styles.avatar, { width: 55 * ratioDisplay }]}
            />
          ) : (
            <View />
          )}
          {onEditProp != null && (
            <View style={styles.editContainer}>
              <PressableNative
                style={[styles.edit, { borderColor: readableColor }]}
                onPress={onEdit}
                hitSlop={20}
              >
                <Icon
                  icon="edit"
                  size={17}
                  style={{ tintColor: readableColor }}
                />
                <Text variant="button" style={{ color: readableColor }}>
                  <FormattedMessage
                    defaultMessage="Edit"
                    description="ContactCard - Label for edit button"
                  />
                </Text>
              </PressableNative>
            </View>
          )}
        </View>
        <View style={styles.webcardText}>
          <Text
            variant="large"
            style={{
              color: readableColor,
              fontSize: 16 * ratioDisplay,
              lineHeight: 20 * ratioDisplay,
            }}
            numberOfLines={1}
          >
            {formatDisplayName(contactCard?.firstName, contactCard?.lastName)}
          </Text>
          <View style={styles.webCardLabelContainer}>
            <View key="left-panel" style={styles.leftPanel}>
              {contactCard.title && (
                <Text variant="small" style={{ color: readableColor }}>
                  {contactCard.title}
                </Text>
              )}

              {company && (
                <Text variant="smallbold" style={{ color: readableColor }}>
                  {company}
                </Text>
              )}
            </View>
            <View key="right-panel" style={styles.rightPanel}>
              {phone && (
                <Text
                  variant="xsmall"
                  style={{ color: readableColor, textAlign: 'right' }}
                >
                  {phone}
                </Text>
              )}
              {mail && (
                <Text
                  variant="xsmall"
                  style={{ color: readableColor, textAlign: 'right' }}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {mail}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export const CONTACT_CARD_RATIO = 1.7; //new ratio choose by @upmitt
export const CONTACT_CARD_RADIUS_HEIGHT = 1 / 9;
// use in list on HomeScreen
export default memo(ContactCard);
export const CONTACT_CARD_ASPECT_RATIO = 0.6;

const EDIT_BORDER_RADIUS = 27;

const stylesheet = createStyleSheet(appearance => ({
  webCardContainer: {
    aspectRatio: CONTACT_CARD_RATIO,
    overflow: 'visible',
    flexDirection: 'row',
    borderCurve: 'continuous',
    ...shadow({ appearance }),
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
    flex: 1,
    flexDirection: 'column',
    width: '100%',
  },
  avatarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  webcardText: {
    flexDirection: 'column',
    height: '100%',
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    rowGap: 5,
  },

  webCardLabelContainer: {
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    gap: 5,
  },
  rightPanel: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 5,
  },
  avatar: {
    aspectRatio: 1,
    borderRadius: 55,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: colors.white,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  editContainer: { overflow: 'hidden', borderRadius: EDIT_BORDER_RADIUS },
  edit: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    alignItems: 'center',
    borderRadius: EDIT_BORDER_RADIUS,
    minWidth: 80,
    height: 35,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
}));
