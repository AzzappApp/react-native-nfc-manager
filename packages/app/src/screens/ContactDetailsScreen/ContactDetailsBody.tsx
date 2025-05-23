import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import cloneDeep from 'lodash/cloneDeep';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useColorScheme, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { ENABLE_DATA_ENRICHMENT } from '#Config';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { useShareContact } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getLocalCachedMediaFile } from '#helpers/mediaHelpers/remoteMediaCache';
import useBoolean from '#hooks/useBoolean';
import useRemoveContact from '#hooks/useRemoveContact';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import Text from '#ui/Text';
import ContactDetailActionModal from './ContactDetailActionModal';
import { ContactDetailAvatar } from './ContactDetailAvatar';
import { ContactDetailEnrichOverlay } from './ContactDetailEnrichOverlay';
import { ContactDetailFragmentAI } from './ContactDetailFragmentAI';
import { ContactDetailFragmentContact } from './ContactDetailFragmentContact';
import type { ContactType } from '#helpers/contactHelpers';
import type { ContactDetailAvatar_webCard$key } from '#relayArtifacts/ContactDetailAvatar_webCard.graphql';
import type {
  ContactDetailsBody_contact$data,
  ContactDetailsBody_contact$key,
} from '#relayArtifacts/ContactDetailsBody_contact.graphql';

import type { ContactDetailsRoute } from '#routes';

export type ContactDetailEnrichState =
  | 'idle'
  | 'loading'
  | 'tooltipVisible'
  | 'waitingApproval';

const BLUR_GAP = 20;

type ContactDetailsBodyProps = {
  contact: ContactType;
  webCard: ContactDetailAvatar_webCard$key | null;
  contactKey: ContactDetailsBody_contact$key | null;
  onClose: () => void;
  onSave: () => void;
  refreshQuery?: () => void;
  hasFocus?: boolean;
};

export type HiddenFields = {
  firstName: boolean;
  lastName: boolean;
  company: boolean;
  title: boolean;
  birthday: boolean;
  avatarId: boolean;
  logoId: boolean;
  phoneNumbers: boolean[];
  emails: boolean[];
  addresses: boolean[];
  socials: boolean[];
  urls: boolean[];
};

const ContactDetailsBody = ({
  contact,
  contactKey,
  webCard: webCardKey,
  onSave,
  onClose,
  refreshQuery,
  hasFocus,
}: ContactDetailsBodyProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);
  const router = useRouter();

  const data = useFragment(
    graphql`
      fragment ContactDetailsBody_contact on Contact
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
      ) {
        id
        ...ContactDetailFragmentContact_contact
        ...ContactDetailFragmentAI_contact
        ...ContactDetailAvatar_contact
        ...ContactDetailActionModal_contact
        ...contactHelpersShareContactDataQuery_contact
        enrichmentStatus
        firstName
        lastName
        company
        title
        avatar {
          id
          uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
        }
        logo {
          id
          uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
        }
        enrichment {
          id
          approved
          fields {
            title
            company
            addresses {
              address
              label
            }
            avatar {
              uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
              id
            }
            emails {
              label
              address
            }
            phoneNumbers {
              label
              number
            }
            socials {
              label
              url
            }
            urls {
              url
            }
          }
        }
        contactProfile {
          id
          webCard {
            id
            cardIsPublished
            userName
            hasCover
            coverMedia {
              id
              ... on MediaVideo {
                webCardPreview: thumbnail(
                  width: $screenWidth
                  pixelRatio: $pixelRatio
                )
              }
              ... on MediaImage {
                webCardPreview: uri(
                  width: $screenWidth
                  pixelRatio: $pixelRatio
                )
              }
            }
          }
        }
      }
    `,
    contactKey,
  );

  const [isMoreVisible, showMore, hideMore] = useBoolean(false);

  const getDefaultContactEnrichmentHiddenFields = useCallback(() => {
    return {
      firstName: false,
      lastName: false,
      company: false,
      title: false,
      birthday: false,
      avatarId: false,
      phoneNumbers:
        data?.enrichment?.fields?.phoneNumbers?.map(() => false) || [],
      emails: data?.enrichment?.fields?.emails?.map(() => false) || [],
      addresses: data?.enrichment?.fields?.addresses?.map(() => false) || [],
      socials: data?.enrichment?.fields?.socials?.map(() => false) || [],
      urls: data?.enrichment?.fields?.urls?.map(() => false) || [],
      logoId: false,
    };
  }, [
    data?.enrichment?.fields?.addresses,
    data?.enrichment?.fields?.emails,
    data?.enrichment?.fields?.phoneNumbers,
    data?.enrichment?.fields?.socials,
    data?.enrichment?.fields?.urls,
  ]);

  const [hiddenFields, setHiddenFields] = useState<HiddenFields>(
    getDefaultContactEnrichmentHiddenFields(),
  );

  useEffect(() => {
    // the goal here is to refresh precomputed map when data?.enrichment changes
    setHiddenFields(getDefaultContactEnrichmentHiddenFields());
  }, [getDefaultContactEnrichmentHiddenFields, data?.enrichment]);

  const [commit] = useMutation(graphql`
    mutation ContactDetailsBodyMutation($contactId: ID!) {
      enrichContact(contactId: $contactId) {
        contact {
          id
        }
      }
    }
  `);

  const [commitApproval] = useMutation(graphql`
    mutation ContactDetailsBodyEnrichmentMutation(
      $contactEnrichmentId: ID!
      $approved: Boolean!
      $input: HiddenFieldInput
      $pixelRatio: Float!
    ) {
      approveContactEnrichment(
        contactEnrichmentId: $contactEnrichmentId
        approved: $approved
        input: $input
      ) {
        contactEnrichment {
          id
          approved
          fields {
            addresses {
              address
              label
            }
            avatar {
              uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
              id
            }
            birthday
            company
            title
            emails {
              label
              address
            }
            phoneNumbers {
              label
              number
            }
            socials {
              label
              url
            }
            urls {
              url
            }
          }
        }
      }
    }
  `);
  const onEnrich = async () => {
    commit({
      variables: {
        contactId: data?.id,
      },
      onCompleted: () => {
        setOverlayState('loading');
      },
      onError: () => {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Enrichment failure',
            description:
              'ContactDetailsScreen - Error message when enrichment start failed',
          }),
        });
        setOverlayState('idle');
      },
    });
  };

  const onShare = useShareContact(data);

  const appearance = useColorScheme();

  const { width: screenWidth } = useScreenDimensions();
  const { top, bottom } = useScreenInsets();

  const backgroundWidth = screenWidth + BLUR_GAP * 2;
  const backgroundImageUrl = useMemo(() => {
    if (!hiddenFields.avatarId && data?.enrichment?.fields?.avatar) {
      if (data?.enrichment?.fields?.avatar.id) {
        const localFile = getLocalCachedMediaFile(
          data?.enrichment?.fields?.avatar.id,
          'image',
        );
        if (localFile) {
          return localFile;
        }
      }
      return data?.enrichment?.fields?.avatar.uri;
    }
    if (data?.logo) {
      if (data?.logo?.id) {
        const localFile = getLocalCachedMediaFile(data?.logo.id, 'image');
        if (localFile) {
          return localFile;
        }
      }
      return data.logo.uri;
    }
    if (data?.avatar) {
      if (data?.avatar?.id) {
        const localFile = getLocalCachedMediaFile(data.avatar.id, 'image');
        if (localFile) {
          return localFile;
        }
      }
      if (data?.avatar?.uri) {
        return data.avatar.uri;
      }
    }
    const webCardPreview =
      data?.contactProfile?.webCard &&
      data?.contactProfile?.webCard?.coverMedia?.webCardPreview
        ? {
            id: data?.contactProfile?.webCard?.coverMedia?.id,
            uri: data?.contactProfile?.webCard?.coverMedia?.webCardPreview,
          }
        : {};
    if (webCardPreview?.id) {
      const localFile = getLocalCachedMediaFile(webCardPreview.id, 'image');
      if (localFile) {
        return localFile;
      }
    }
    return webCardPreview?.uri ?? undefined;
  }, [
    hiddenFields.avatarId,
    data?.enrichment?.fields?.avatar,
    data?.logo,
    data?.avatar,
    data?.contactProfile?.webCard,
  ]);

  const removeContact = useRemoveContact({
    onCompleted: () => {
      hideMore();
      router.back();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Contact removal failure',
          description:
            'ContactDetailsScreen - Error message when remove contact failed',
        }),
      });
    },
  });

  const onRemoveContacts = useCallback(() => {
    if (!data?.id) {
      return;
    }
    removeContact([data?.id]);
  }, [data?.id, removeContact]);

  const onEditContact = useCallback(() => {
    hideMore();
    router.push({
      route: 'CONTACT_EDIT',
      params: {
        contact,
      },
    });
  }, [contact, hideMore, router]);

  const [subView, setSubView] = useState<'AI' | 'contact'>('contact');

  const enrichStatusToOverlayState = useCallback(
    (data: ContactDetailsBody_contact$data) => {
      return data?.enrichmentStatus === 'pending' ||
        data?.enrichmentStatus === 'running'
        ? 'loading'
        : (data?.enrichmentStatus === 'completed' ||
              data?.enrichmentStatus === 'failed') &&
            data?.enrichment?.approved !== null
          ? 'idle'
          : data?.enrichment?.approved === null
            ? 'waitingApproval'
            : 'idle';
    },
    [],
  );

  const initOverlayState = useCallback((): ContactDetailEnrichState => {
    if (router.getCurrentRoute()?.route === 'CONTACT_DETAILS') {
      const initialOverlayRoute = (
        router.getCurrentRoute() as ContactDetailsRoute
      ).params.overlay;
      if (initialOverlayRoute) {
        return initialOverlayRoute;
      }
    }
    if (!data) return 'idle';
    return enrichStatusToOverlayState(data);
  }, [data, enrichStatusToOverlayState, router]);

  const [overlayState, setOverlayState] = useState<ContactDetailEnrichState>(
    () => initOverlayState(),
  );

  useEffect(() => {
    if (data && overlayState !== 'tooltipVisible') {
      setOverlayState(enrichStatusToOverlayState(data));
    }

    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enrichStatusToOverlayState]);

  useEffect(() => {
    if (hasFocus && overlayState === 'loading') {
      const itv = setInterval(() => {
        refreshQuery?.();
      }, 10000);
      return () => {
        clearInterval(itv);
      };
    }
  }, [refreshQuery, hasFocus, overlayState]);

  const onValidateEnrichment = useCallback(() => {
    commitApproval({
      variables: {
        contactEnrichmentId: data?.enrichment?.id,
        approved: true,
        input: {
          contact: hiddenFields,
        },
        pixelRatio: CappedPixelRatio(),
      },
      onCompleted: () => {
        setOverlayState('idle');
      },
      onError: () => {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Enrichment validation failure',
            description:
              'ContactDetailsScreen - Error message when enrichment validation failed',
          }),
        });
      },
    });
  }, [commitApproval, data?.enrichment?.id, hiddenFields, intl]);

  const onRefuseEnrichment = useCallback(() => {
    commitApproval({
      variables: {
        contactEnrichmentId: data?.enrichment?.id,
        approved: false,
        pixelRatio: CappedPixelRatio(),
      },
      onError: () => {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Enrichment failure',
            description:
              'ContactDetailsScreen - Error message when enrichment failed',
          }),
        });
      },
    });
  }, [commitApproval, data?.enrichment?.id, intl]);

  const onRemoveField = useCallback((field: string, index?: number) => {
    setHiddenFields(prev => {
      if (!field || !(field in prev)) {
        return prev;
      }
      const newField = cloneDeep(prev);
      const fieldValue = field as keyof typeof newField;

      if (index === undefined) {
        if (
          fieldValue === 'avatarId' ||
          fieldValue === 'birthday' ||
          fieldValue === 'company' ||
          fieldValue === 'firstName' ||
          fieldValue === 'lastName' ||
          fieldValue === 'title'
        ) {
          newField[fieldValue] = true;
        }
      } else if (Array.isArray(newField[fieldValue])) {
        if (
          (fieldValue === 'phoneNumbers' ||
            fieldValue === 'emails' ||
            fieldValue === 'addresses' ||
            fieldValue === 'socials' ||
            fieldValue === 'urls') &&
          Array.isArray(prev[fieldValue]) &&
          newField[fieldValue].length > index
        ) {
          newField[fieldValue][index] = true;
        }
      } else {
        console.error('setting incorrect field', fieldValue);
      }
      return newField;
    });
  }, []);

  return (
    <Container style={styles.container}>
      {ENABLE_DATA_ENRICHMENT && (
        <ContactDetailEnrichOverlay
          onEnrich={onEnrich}
          state={overlayState}
          onValidateEnrichment={onValidateEnrichment}
          onRefuseEnrichment={onRefuseEnrichment}
        />
      )}
      {backgroundImageUrl ? (
        <View
          style={[styles.avatarBackgroundContainer, { width: backgroundWidth }]}
        >
          <Image
            source={backgroundImageUrl}
            style={styles.flex}
            blurRadius={8.2}
            contentFit="cover"
          />
          <LinearGradient
            colors={[
              appearance === 'dark' ? 'transparent' : 'rgba(255, 255, 255, 0)',
              appearance === 'dark' ? colors.black : colors.white,
            ]}
            start={{ x: 0, y: 0.1 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.avatarBackgroundGradient,
              { width: backgroundWidth },
            ]}
          />
        </View>
      ) : undefined}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: top,
            paddingBottom:
              bottom + 100 + (overlayState === 'waitingApproval' ? 145 : 0),
          },
        ]}
      >
        <View style={styles.content}>
          <IconButton
            icon="close"
            size={24}
            disabled={
              data?.enrichmentStatus === 'running' ||
              data?.enrichmentStatus === 'pending'
            }
            variant="icon"
            style={styles.close}
            onPress={onClose}
          />
          <IconButton
            icon="share"
            size={24}
            disabled={
              overlayState === 'loading' || overlayState === 'waitingApproval'
            }
            variant="icon"
            style={styles.share}
            onPress={onShare}
          />

          <ContactDetailAvatar
            state={overlayState}
            isHiddenField={hiddenFields.avatarId}
            onRemoveField={() => onRemoveField('avatarId')}
            webCard={webCardKey}
            contactKey={data}
          />
          <Text variant="large" style={styles.name}>
            {`${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim()}
          </Text>
          <DisposableText
            text={data?.company}
            enrichedText={
              hiddenFields.company
                ? undefined
                : data?.enrichment?.fields?.company
            }
            onRemove={() => onRemoveField('company')}
            state={overlayState}
          />
          <DisposableText
            text={data?.title}
            enrichedText={
              hiddenFields.title ? undefined : data?.enrichment?.fields?.title
            }
            onRemove={() => onRemoveField('title')}
            state={overlayState}
          />
          {ENABLE_DATA_ENRICHMENT && (
            <View style={styles.saveContainer}>
              <MenuItem
                onSelect={() => setSubView('contact')}
                label={intl.formatMessage({
                  defaultMessage: 'Contact',
                  description:
                    'ContactDetailsModal - Button to switch to contact view',
                })}
                selected={subView === 'contact'}
                overlayState={overlayState}
              />
              <MenuItem
                onSelect={() => setSubView('AI')}
                label={intl.formatMessage({
                  defaultMessage: 'Profile',
                  description:
                    'ContactDetailsModal - Button to switch to AI profile view',
                })}
                selected={subView === 'AI'}
                overlayState={overlayState}
              />
            </View>
          )}

          {subView === 'contact' && (
            <ContactDetailFragmentContact
              showMore={showMore}
              hiddenFields={hiddenFields}
              onSave={onSave}
              state={overlayState}
              onRemoveField={onRemoveField}
              contact={data}
            />
          )}
          {subView === 'AI' && <ContactDetailFragmentAI contact={data} />}
        </View>
      </ScrollView>
      {data ? (
        <ContactDetailActionModal
          visible={isMoreVisible}
          close={hideMore}
          onRemoveContacts={onRemoveContacts}
          onSaveContact={onSave}
          onShare={onShare}
          contact={data}
          onEdit={onEditContact}
          onEnrich={onEnrich}
        />
      ) : undefined}
    </Container>
  );
};

const MenuItem = ({
  onSelect,
  label,
  selected,
  overlayState,
}: {
  onSelect: () => void;
  label: string;
  selected: boolean;
  overlayState: ContactDetailEnrichState;
}) => {
  const styles = useStyleSheet(stylesheet);

  return (
    <RoundedMenuComponent
      selected={selected}
      label={label}
      id="contact"
      onSelect={onSelect}
      style={styles.roundButton}
      textStyle={styles.roundButtonTextStyle}
      selectedTextStyle={styles.roundButtonSelectedTextStyle}
      selectedStyle={styles.roundButtonSelectedStyle}
      rightElement={
        overlayState === 'waitingApproval' ? (
          <Icon
            icon="filters_ai_light"
            size={24}
            style={styles.menuAiIndicator}
          />
        ) : undefined
      }
    />
  );
};

const DisposableText = ({
  text,
  enrichedText,
  onRemove,
  state,
}: {
  text?: string | null;
  enrichedText?: string | null;
  onRemove: () => void;
  state: ContactDetailEnrichState;
}) => {
  const styles = useStyleSheet(stylesheet);

  if (!text && !enrichedText) return null;

  if (state === 'waitingApproval' && enrichedText) {
    return (
      <View style={styles.textContainer}>
        <Text style={styles.invisible}>{enrichedText}</Text>
        <MaskedView
          style={styles.textMaskStyle}
          maskElement={<Text style={styles.flex}>{enrichedText}</Text>}
        >
          <LinearGradient
            // Button Linear Gradient
            colors={['#B02EFB', '#0B4693', '#0B4693', '#23CFCC']}
            locations={[0, 0.05, 0.9, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.87, y: 0.87 }}
            style={styles.flex}
          />
        </MaskedView>
        <IconButton
          size={14}
          iconSize={12}
          icon="close"
          onPress={onRemove}
          style={styles.textIconStyle}
        />
      </View>
    );
  }
  return <Text style={styles.company}>{enrichedText || text}</Text>;
};

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    overflow: 'visible',
  },
  close: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 44,
    height: 44,
    borderRadius: 38,
    justifyContent: 'center',
    backgroundColor: appearance === 'dark' ? '#0000003F' : '#FFFFFF3F',
    opacity: 0.75,
  },
  share: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 38,
    justifyContent: 'center',
    backgroundColor: appearance === 'dark' ? '#0000003F' : '#FFFFFF3F',
  },
  name: {
    marginTop: 20,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'visible',
  },
  company: {
    marginTop: 5,
  },
  job: {
    marginTop: 5,
    color: colors.grey400,
  },
  saveContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingBottom: 10,
    marginTop: 20,
    gap: 5,
  },
  avatarBackgroundContainer: {
    top: -BLUR_GAP,
    left: -BLUR_GAP,
    position: 'absolute',
    height: 387,
  },
  flex: {
    flex: 1,
  },
  avatarBackgroundGradient: {
    position: 'absolute',
    height: 387,
  },
  scroll: {
    marginHorizontal: 20,
    overflow: 'visible',
  },
  menuAiIndicator: {
    position: 'absolute',
    right: 10,
    tintColor: undefined,
  },
  textIconStyle: {
    position: 'absolute',
    right: -19,
    top: 2,
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
  },
  roundButton: {
    flex: 1,
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    borderWidth: 1,
    borderColor: appearance === 'dark' ? colors.white : colors.black,
  },
  roundButtonTextStyle: {
    color: appearance === 'dark' ? colors.white : colors.black,
  },
  roundButtonSelectedTextStyle: {
    color: appearance === 'dark' ? colors.black : colors.white,
  },
  roundButtonSelectedStyle: {
    backgroundColor: appearance === 'dark' ? colors.white : colors.black,
  },
  invisible: { opacity: 0 },
  textMaskStyle: {
    flexDirection: 'row',
    gap: 5,
    position: 'absolute',
    flex: 1,
    width: '100%',
    height: '100%',
  },
  textContainer: { flexDirection: 'row', gap: 5, marginTop: 5 },
}));

export default ContactDetailsBody;
