import { Canvas, ImageSVG, Skia } from '@shopify/react-native-skia';
import { toString } from 'qrcode';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { graphql } from 'react-relay';
import VCard from 'vcard-creator';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import {
  addressLabelToVCardLabel,
  emailLabelToVCardLabel,
  phoneLabelToVCardLabel,
} from '@azzapp/shared/vCardHelpers';
import { colors } from '#theme';
import AnimatedText from '#components/AnimatedText';
import {
  CONTACT_CARD_RATIO,
  ContactCardComponent,
} from '#components/ContactCard/ContactCard';
import { useRouter } from '#components/NativeRouter';
import EmptyContent from '#components/ui/EmptyContent';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getOfflineVCard } from '#helpers/offlineVCard';
import { useProfileInfos } from '#hooks/authStateHooks';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import { HomeBackgroundComponent } from '#screens/HomeScreen/HomeBackground';
import { AnimatedHomeHeaderCentralComponent } from '#screens/HomeScreen/HomeHeader';
import { useIndexInterpolation } from '#screens/HomeScreen/homeHelpers';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import { PageProgress } from '#ui/PageProgress';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import OfflineHeader from './OfflineHeader';

export const OfflineVCardScreenProfilesFragment = graphql`
  fragment OfflineVCardScreen_profiles on Profile @relay(plural: true) {
    id
    webCard {
      id
      isMultiUser
      userName
      cardIsPublished
      commonInformation {
        company
        addresses {
          address
          label
        }
        emails {
          label
          address
        }
        phoneNumbers {
          label
          number
        }
        urls {
          address
        }
        socials {
          label
          url
        }
      }
      cardColors {
        dark
        primary
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
      urls {
        address
      }
      addresses {
        address
        label
      }
      birthday {
        birthday
      }
      socials {
        url
        label
      }
    }
  }
`;

const OfflineVCardScreen = () => {
  const router = useRouter();
  return <OfflineVCardScreenRenderer canLeaveScreen onClose={router.back} />;
};

export default OfflineVCardScreen;

export type OfflineVCardScreenRendererProps = {
  canLeaveScreen: boolean;
  onClose: () => void;
};

export const OfflineVCardScreenRenderer = ({
  canLeaveScreen,
  onClose,
}: OfflineVCardScreenRendererProps) => {
  const styles = useStyleSheet(stylesheet);
  const profileInfos = useProfileInfos();

  const [currentIndex, setCurrentIndex] = useState(0);
  const { top, bottom } = useScreenInsets();

  const { width: windowWidth, height: fullWindowHeight } =
    useScreenDimensions();
  const windowHeight = fullWindowHeight - top - bottom;

  const itemMargin = (windowWidth * 5) / 100;
  const halfMargin = itemMargin / 2;
  const itemWidth = (windowWidth * 90) / 100;
  const itemHeight = itemWidth / CONTACT_CARD_RATIO;

  const pageViewSize = 25;
  const headerSize = 230;
  const footerSize = itemHeight + pageViewSize;

  const remainingHeight = windowHeight - headerSize - footerSize;
  const remainingWidth = itemWidth;

  const qrCodeContainerSize = Math.min(remainingWidth, remainingHeight);
  const qrCodeSize = qrCodeContainerSize - 40;

  const swipableZoneHeight = qrCodeContainerSize + itemHeight + 30;
  const flatListPositionInSwipableZone = qrCodeContainerSize + 30;

  const { isPremium, vCardList } = useMemo(() => {
    const offlineData = getOfflineVCard();
    const { isPremium, profiles } = offlineData || {};

    return {
      isPremium: isPremium ?? null,
      vCardList:
        profiles
          ?.map(data => {
            const contactCard = data.contactCard;
            const webCard = data.webCard;
            if (!webCard?.userName) {
              return undefined;
            }
            if (!webCard || !webCard.cardIsPublished) return undefined;
            const vCard = new VCard();
            vCard.addName(
              contactCard?.lastName ?? undefined,
              contactCard?.firstName ?? undefined,
            );

            if (contactCard?.title) {
              vCard.addJobtitle(contactCard.title);
            }
            if (contactCard?.birthday) {
              vCard.addBirthday(contactCard.birthday?.birthday.toString());
            }
            contactCard?.phoneNumbers?.forEach(number => {
              vCard.addPhoneNumber(
                number.number,
                phoneLabelToVCardLabel(number.label) || '',
              );
            });
            contactCard?.emails?.forEach(email => {
              vCard.addEmail(
                email.address,
                emailLabelToVCardLabel(email.label) || '',
              );
            });
            contactCard?.urls?.forEach(url => {
              vCard.addURL(url.address);
            });
            contactCard?.socials?.forEach(social => {
              vCard.addSocial(social.url, social.label || '');
            });
            contactCard?.addresses?.forEach(addr => {
              vCard.addAddress(
                undefined,
                undefined,
                addr.address,
                undefined,
                undefined,
                undefined,
                undefined,
                addressLabelToVCardLabel(addr.label),
              );
            });
            if (webCard?.isMultiUser) {
              webCard?.commonInformation?.phoneNumbers?.forEach(number => {
                vCard.addPhoneNumber(
                  number.number,
                  phoneLabelToVCardLabel(number.label) || '',
                );
              });
              webCard?.commonInformation?.emails?.forEach(email => {
                vCard.addEmail(
                  email.address,
                  emailLabelToVCardLabel(email.label) || '',
                );
              });
              webCard?.commonInformation?.urls?.forEach(url => {
                vCard.addURL(url.address);
              });
              webCard?.commonInformation?.socials?.forEach(social => {
                vCard.addSocial(social.url, social.label || '');
              });
              webCard?.commonInformation?.addresses?.forEach(addr => {
                vCard.addAddress(
                  undefined,
                  undefined,
                  addr.address,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  addressLabelToVCardLabel(addr.label),
                );
              });
            }
            if (webCard?.userName) vCard.addURL(buildWebUrl(webCard?.userName));

            const company =
              webCard?.isMultiUser && webCard?.commonInformation?.company
                ? webCard?.commonInformation?.company
                : contactCard?.company;
            if (company) {
              vCard.addCompany(company);
            }

            const qrCodeData = vCard.toString();
            return {
              qrCodeData,
              primaryColor: webCard?.cardColors?.primary || '#45444b',
              dark: webCard?.cardColors?.dark || colors.black,
              isMultiUser: webCard?.isMultiUser,
              name: webCard?.userName,
              firstName: contactCard?.firstName,
              lastName: contactCard?.lastName,
              title: contactCard?.title,
              company: company || null,
              id: webCard.id,
              //we take contactCard first on purpose as we are displaying only one email/phone number on new contact card. Validated with @upmitt
              emails: contactCard?.emails
                ? contactCard?.emails
                : webCard?.isMultiUser
                  ? webCard?.commonInformation?.emails
                  : null,
              phoneNumbers: contactCard?.phoneNumbers
                ? contactCard?.phoneNumbers
                : webCard?.isMultiUser
                  ? webCard.commonInformation?.phoneNumbers
                  : null,
            };
          })
          .filter(isDefined) || [],
    };
  }, []);

  const defaultIndex = useMemo(() => {
    if (!profileInfos?.webCardId) return 0;
    const foundVCardId = vCardList.findIndex(
      vcard => vcard.id === profileInfos?.webCardId,
    );
    return foundVCardId === -1 ? 0 : foundVCardId;
  }, [profileInfos?.webCardId, vCardList]);

  const userNames = useMemo(
    () => vCardList.map(({ name }) => name || ''),
    [vCardList],
  );

  const gradientColors = useMemo(
    () =>
      vCardList.length === 0
        ? [['#45444b', colors.black]]
        : vCardList.map(({ primaryColor, dark }) => [primaryColor, dark]),
    [vCardList],
  );

  const currentIndexSharedValue = useSharedValue(0);

  const qrCodeContainerleft = (windowWidth - qrCodeContainerSize) / 2;

  const renderItem = ({ item }: { item: (typeof vCardList)[number] }) => {
    const vCard = item;
    const webCard = {
      cardColors: { primary: vCard.primaryColor },
      commonInformation: {
        company: vCard.company || null,
        emails: vCard.emails || null,
        phoneNumbers: vCard.phoneNumbers || null,
      },
      isMultiUser: vCard.isMultiUser,
    };

    const contactCard = {
      company: vCard.company || null,
      firstName: vCard.firstName || null,
      lastName: vCard.lastName || null,
      title: vCard.title || null,
      emails: vCard.emails || null,
      phoneNumbers: vCard.phoneNumbers || null,
    };

    return (
      <View
        style={[
          {
            width: itemWidth,
            height: itemHeight,
          },
          styles.contactCard,
        ]}
      >
        <ContactCardComponent
          webCard={webCard}
          height={itemHeight}
          style={styles.contactCard}
          contactCard={contactCard}
        />
      </View>
    );
  };

  const keyExtractor = (vCard: { name: string }) => vCard.name;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const index = event.contentOffset.x / (itemWidth + halfMargin);
      currentIndexSharedValue.value = index;
    },
  });

  useAnimatedReaction(
    () => Math.round(currentIndexSharedValue.value),
    index => {
      runOnJS(setCurrentIndex)(index);
    },
    [],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: itemWidth + halfMargin,
      offset: (itemWidth + halfMargin) * index,
      index,
    }),
    [halfMargin, itemWidth],
  );
  const snapToOffsets = useMemo(
    () => vCardList.map((_, index) => (itemWidth + halfMargin) * index),
    [halfMargin, itemWidth, vCardList],
  );

  const readableColors = useMemo(
    () =>
      vCardList.length === 0
        ? [colors.white]
        : vCardList.map(card => {
            return card?.primaryColor
              ? getTextColor(card?.primaryColor)
              : colors.white;
          }) || [],
    [vCardList],
  );

  const colorValue = useIndexInterpolation<string>(
    currentIndexSharedValue,
    readableColors,
    colors.white,
    interpolateColor,
  );

  const animatedIconsColor = useAnimatedStyle(() => {
    return { tintColor: colorValue.value };
  });

  const intl = useIntl();
  const offlineText = intl.formatMessage({
    defaultMessage: 'Offline mode',
    description: 'offline mode screen - header description',
  });

  const offlineModeText = useDerivedValue(() => offlineText);

  const renderSeparator = () => <View style={{ width: halfMargin }} />;

  const contentContainerStyle = {
    top: flatListPositionInSwipableZone,
    paddingStart: itemMargin,
    paddingEnd: itemMargin,
    height: itemHeight,
  };

  return (
    <Container style={styles.container}>
      <SafeAreaView style={styles.container}>
        <HomeBackgroundComponent
          gradientColors={gradientColors}
          currentIndexSharedValue={currentIndexSharedValue}
        />
        <Header
          leftElement={
            canLeaveScreen ? (
              <PressableNative onPress={onClose}>
                <Icon icon="close" style={animatedIconsColor} />
              </PressableNative>
            ) : undefined
          }
          middleElement={
            <AnimatedHomeHeaderCentralComponent
              isPremium={isPremium}
              color={colorValue}
            />
          }
          style={styles.header}
        />
        {userNames.length ? (
          <OfflineHeader
            userNames={userNames}
            currentIndexSharedValue={currentIndexSharedValue}
          />
        ) : (
          <View style={styles.offlineHeader} />
        )}
        <View style={styles.iconAndTextHeader}>
          <Icon icon="offline" style={[styles.icon, animatedIconsColor]} />
          <AnimatedText
            variant="large"
            style={styles.animatedText}
            animatedTextColor={colorValue}
            text={offlineModeText}
          />
          {vCardList.length > 0 && (
            <Text variant="small" style={styles.subtitleOneWay}>
              <FormattedMessage
                defaultMessage="One way share - no contact will be returned"
                description="Offline Screen: one way share description"
              />
            </Text>
          )}
        </View>
        <View style={styles.separator} />
        <View
          style={[
            styles.qrCodeContainer,
            {
              width: qrCodeContainerSize,
              height: qrCodeContainerSize,
              left: qrCodeContainerleft,
            },
          ]}
        >
          {vCardList.length > 0 ? (
            <Suspense fallback={null}>
              <QRCode
                width={qrCodeSize}
                value={vCardList[currentIndex]?.qrCodeData}
              />
            </Suspense>
          ) : (
            <EmptyContent
              message={
                <FormattedMessage
                  defaultMessage="No published card"
                  description="Offline Screen: no published card header"
                />
              }
              description={
                <FormattedMessage
                  defaultMessage="Seems like you don't have any card published..."
                  description="Offline Screen: no published card description"
                />
              }
              colorScheme="dark"
            />
          )}
        </View>
        <View style={styles.separator} />
        <View
          style={{
            overflow: 'visible',
            height: swipableZoneHeight,
            top: -flatListPositionInSwipableZone,
          }}
        >
          <Animated.FlatList
            data={vCardList}
            horizontal
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToAlignment="start"
            disableIntervalMomentum
            pagingEnabled
            bounces={false}
            onScroll={scrollHandler}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            initialNumToRender={5}
            windowSize={7}
            maxToRenderPerBatch={7}
            snapToOffsets={snapToOffsets}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={contentContainerStyle}
            initialScrollIndex={defaultIndex}
          />
        </View>
        <View
          style={[
            styles.progress,
            { top: -flatListPositionInSwipableZone + pageViewSize / 2 },
          ]}
        >
          {vCardList.length > 1 ? (
            <PageProgress
              nbPages={vCardList.length}
              currentPage={currentIndex}
              appearance="dark"
            />
          ) : undefined}
        </View>
      </SafeAreaView>
    </Container>
  );
};

const QRCode = ({ value, width }: { width: number; value: string }) => {
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    const generateQRCode = async () => {
      const qrCode = await toString(value, {
        errorCorrectionLevel: 'L',
        type: 'svg',
        width,
        margin: 0,
        color: {
          dark: colors.black,
          light: colors.white,
        },
      });
      setQrCode(qrCode);
    };

    generateQRCode();
  }, [value, width]);

  const svg = qrCode ? Skia.SVG.MakeFromString(qrCode) : null;

  return (
    <Canvas
      style={{
        width,
        height: width,
      }}
      key={qrCode}
    >
      <ImageSVG svg={svg} />
    </Canvas>
  );
};

const stylesheet = createStyleSheet(() => ({
  container: {
    flex: 1,
  },
  header: { backgroundColor: 'transparent' },
  offlineHeader: { height: 40 },
  iconAndTextHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
  },
  unselectedColor: {
    backgroundColor: 'transparent',
    textColor: colors.white,
  },
  selectedColors: {
    backgroundColor: colors.white,
    textColor: 'black',
  },
  qrCodeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 34,
  },
  progress: {
    alignContent: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    height: 25,
  },
  separator: { height: 30 },
  icon: { marginTop: 20 },
  animatedText: {
    width: '100%',
    textAlign: 'center',
  },
  contactCard: {
    alignContent: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  subtitleOneWay: {
    paddingTop: 5,
    color: colors.white,
    opacity: 0.5,
  },
}));
