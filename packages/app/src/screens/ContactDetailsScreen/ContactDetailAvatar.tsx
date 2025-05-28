import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { View, Platform } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors, shadow } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getLocalCachedMediaFile } from '#helpers/mediaHelpers/remoteMediaCache';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { ContactDetailAvatar_contact$key } from '#relayArtifacts/ContactDetailAvatar_contact.graphql';
import type { ContactDetailAvatar_webCard$key } from '#relayArtifacts/ContactDetailAvatar_webCard.graphql';
import type { ContactDetailEnrichState } from './ContactDetailsBody';

export const ContactDetailAvatar = ({
  state,
  isHiddenField,
  onRemoveField,
  webCard: webCardKey,
  contactKey,
}: {
  state: ContactDetailEnrichState;
  isHiddenField: boolean;
  onRemoveField: () => void;
  webCard: ContactDetailAvatar_webCard$key | null;
  contactKey?: ContactDetailAvatar_contact$key | null;
}) => {
  const styles = useStyleSheet(stylesheet);

  const webCard = useFragment(
    graphql`
      fragment ContactDetailAvatar_webCard on WebCard
      @argumentDefinitions(
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
        cappedPixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
      ) {
        id
        ...CoverRenderer_webCard
        coverMedia {
          id
          __typename
          ... on MediaVideo {
            uri(width: $screenWidth, pixelRatio: $pixelRatio)
            thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
            smallThumbnail: thumbnail(width: 125, pixelRatio: $cappedPixelRatio)
          }
        }
      }
    `,
    webCardKey,
  );

  const data = useFragment(
    graphql`
      fragment ContactDetailAvatar_contact on Contact
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        id
        firstName
        lastName
        company
        avatar {
          id
          uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
        }
        logo {
          id
          uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
        }
        enrichment {
          fields {
            avatar {
              id
              uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
            }
            logo {
              id
              uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
            }
          }
        }
      }
    `,
    contactKey,
  );

  const avatarUrl = useMemo(() => {
    if (!isHiddenField && data?.enrichment?.fields?.avatar) {
      if (data.enrichment.fields.avatar.id) {
        const localFile = getLocalCachedMediaFile(
          data.enrichment?.fields?.avatar.id,
          'image',
        );
        if (localFile) {
          return localFile;
        }
      }
      if (data.enrichment.fields.avatar.uri) {
        return data.enrichment.fields.avatar.uri;
      }
    }
    if (data?.avatar) {
      if (data.avatar?.id) {
        const localFile = getLocalCachedMediaFile(data.avatar.id, 'image');
        if (localFile) {
          return localFile;
        }
      }
      if (data?.avatar?.uri) {
        return data.avatar.uri;
      }
    }
    if (data?.logo) {
      if (data.logo?.id) {
        const localFile = getLocalCachedMediaFile(data.logo.id, 'image');
        if (localFile) {
          return localFile;
        }
      }
      return data.logo.uri;
    }
    return undefined;
  }, [
    isHiddenField,
    data?.enrichment?.fields?.avatar,
    data?.avatar,
    data?.logo,
  ]);

  const isAiAvatar =
    state === 'waitingApproval' &&
    !isHiddenField &&
    data?.enrichment?.fields?.avatar;

  return (
    <View style={styles.avatarContainer}>
      {isAiAvatar && (
        <MaskedView
          style={styles.aiOverlayContainer}
          maskElement={<View style={styles.aiMask} />}
        >
          <LinearGradient
            // Button Linear Gradient
            colors={['#B02EFB', '#0B4693', '#0B4693', '#23CFCC']}
            locations={[0, 0.1, 0.9, 1]}
            start={{ x: 0.15, y: 0.15 }}
            end={{ x: 0.87, y: 0.87 }}
            style={styles.aiGradient}
          />
        </MaskedView>
      )}
      <View style={[styles.avatar, styles.avatarWrapper]}>
        {avatarUrl ? (
          <Image source={avatarUrl} style={styles.avatar} />
        ) : webCard ? (
          <CoverRenderer width={AVATAR_WIDTH} webCard={webCard} />
        ) : (
          <Text style={styles.initials}>
            {data?.firstName?.substring(0, 1)}
            {data?.lastName?.substring(0, 1)}
            {!data?.firstName &&
              !data?.lastName &&
              data?.company?.substring(0, 1)}
          </Text>
        )}
      </View>
      {isAiAvatar && (
        <IconButton
          icon="close"
          size={20}
          iconSize={14}
          onPress={onRemoveField}
          style={styles.closeIcon}
        />
      )}
    </View>
  );
};

const AVATAR_WIDTH = 112;
const AVATAR_ENRICHMENT_BORDER_SIZE = 8;

const stylesheet = createStyleSheet(appearance => ({
  avatarContainer:
    Platform.OS === 'ios'
      ? {
          borderRadius: AVATAR_WIDTH / 2,
          ...shadow({ appearance, direction: 'bottom' }),
          paddingTop: 30,
        }
      : {
          borderRadius: AVATAR_WIDTH / 2,
          paddingTop: 30,
        },
  avatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_WIDTH,
    borderRadius: AVATAR_WIDTH / 2,
    borderWidth: 4,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
    overflow: 'visible',
    backgroundColor: colors.grey50,
  },
  avatarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow({ appearance, direction: 'bottom' }),
    backgroundColor: 'white',
  },
  initials: {
    color: colors.grey300,
    fontSize: 50,
    fontWeight: 500,
    lineHeight: 60,
    textTransform: 'uppercase',
  },
  closeIcon: {
    position: 'absolute',
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    right: 0,
    top: 35,
  },
  aiOverlayContainer: {
    height: AVATAR_WIDTH + AVATAR_ENRICHMENT_BORDER_SIZE,
    width: AVATAR_WIDTH + AVATAR_ENRICHMENT_BORDER_SIZE,
    top: 26,
    right: -(AVATAR_ENRICHMENT_BORDER_SIZE / 2),
    position: 'absolute',
  },
  aiMask: {
    borderRadius: (AVATAR_WIDTH + AVATAR_ENRICHMENT_BORDER_SIZE) / 2,
    borderWidth: AVATAR_ENRICHMENT_BORDER_SIZE / 2,
    height: AVATAR_WIDTH + AVATAR_ENRICHMENT_BORDER_SIZE,
    width: AVATAR_WIDTH + AVATAR_ENRICHMENT_BORDER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  aiGradient: {
    height: AVATAR_WIDTH + AVATAR_ENRICHMENT_BORDER_SIZE,
    width: AVATAR_WIDTH + AVATAR_ENRICHMENT_BORDER_SIZE,
  },
}));
