import { Canvas, ImageSVG, Skia } from '@shopify/react-native-skia';
import { toString } from 'qrcode';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { graphql } from 'react-relay';
import VCard from 'vcard-creator';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import {
  addressLabelToVCardLabel,
  emailLabelToVCardLabel,
  phoneLabelToVCardLabel,
} from '@azzapp/shared/vCardHelpers';
import { useNetworkAvailableContext } from '#networkAvailableContext';
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
import useScreenInsets from '#hooks/useScreenInsets';
import { HomeBackgroundComponent } from '#screens/HomeScreen/HomeBackground';
import { AnimatedHomeHeaderCentralComponent } from '#screens/HomeScreen/HomeHeader';
import { useIndexInterpolation } from '#screens/HomeScreen/homeHelpers';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import { PageProgress } from '#ui/WizardPagerHeader';
import OfflineHeader from './OfflineHeader';
import type { OfflineVCardRoute } from '#routes';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

type vCardData = {
  qrcodeData: string;
  primaryColor: string;
  dark: string;
  isMultiUser: boolean;
  name: string;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  title: string | null | undefined;
  compagny: string | null | undefined;
  isPremium: boolean;
  id: string;
};

type renderItemProps = {
  item: vCardData;
};

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
        light
      }
      isPremium
    }
    contactCard {
      firstName
      lastName
      title
      company
      emails {
        label
        address
        selected
      }
      phoneNumbers {
        label
        number
        selected
      }
      urls {
        address
        selected
      }
      addresses {
        address
        label
        selected
      }
      birthday {
        birthday
        selected
      }
      socials {
        url
        label
        selected
      }
    }
  }
`;

const OfflineVCardScreen = () => {
  const router = useRouter();
  const styles = useStyleSheet(stylesheet);
  const profileInfos = useProfileInfos();

  const [canLeaveScreen, setCanLeaveScreen] = useState(
    (router.getCurrentRoute() as OfflineVCardRoute)?.params?.canGoBack,
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const { top } = useScreenInsets();

  const onClose = router.back;

  const { width: windowWidth, height: fullWindowHeight } =
    useWindowDimensions();
  const windowHeight = fullWindowHeight - top;

  const itemMargin = (windowWidth * 5) / 100;
  const halfMargin = itemMargin / 2;
  const itemWidth = (windowWidth * 90) / 100;
  const itemHeight = itemWidth / CONTACT_CARD_RATIO;

  const headerSize = 230;
  const footerSize = itemHeight + 35;

  const remainingHeight = windowHeight - headerSize - footerSize;
  const remaingWidth = itemWidth;

  const qrCodeContainerSize = Math.min(remaingWidth, remainingHeight);
  const qrCodeSize = qrCodeContainerSize - 40;

  const swipableZoneHeight = qrCodeContainerSize + itemHeight + 30;
  const flatListPositionInSwipableZone = qrCodeContainerSize + 30;

  const isConnected = useNetworkAvailableContext();

  useEffect(() => {
    setCanLeaveScreen(isConnected);
  }, [isConnected]);

  const vcardList: vCardData[] = useMemo(() => {
    const profiles = getOfflineVCard();

    return (
      profiles
        ?.map(data => {
          const contactCard = data.contactCard as ContactCard;
          const webCard = data.webCard;
          if (!webCard || !webCard.cardIsPublished) return undefined;
          const vCard = new VCard();
          vCard.addName(
            contactCard.lastName ?? undefined,
            contactCard.firstName ?? undefined,
          );

          if (contactCard.title) {
            vCard.addJobtitle(contactCard.title);
          }
          if (contactCard.birthday && contactCard.birthday?.selected) {
            vCard.addBirthday(contactCard.birthday?.birthday.toString());
          }
          contactCard.phoneNumbers?.forEach(number => {
            if (number.selected)
              vCard.addPhoneNumber(
                number.number,
                phoneLabelToVCardLabel(number.label) || '',
              );
          });
          contactCard.emails?.forEach(email => {
            if (email.selected)
              vCard.addEmail(
                email.address,
                emailLabelToVCardLabel(email.label) || '',
              );
          });
          contactCard.urls?.forEach(url => {
            if (url.selected) vCard.addURL(url.address);
          });
          contactCard?.socials?.forEach(social => {
            if (social.selected)
              vCard.addSocial(social.url, social.label || '');
          });
          contactCard?.addresses?.forEach(addr => {
            if (addr.selected)
              vCard.addAddress(
                addr.address,
                addressLabelToVCardLabel(addr.label) || '',
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
                addr.address,
                addressLabelToVCardLabel(addr.label) || '',
              );
            });
          }
          if (webCard?.userName) vCard.addURL(buildUserUrl(webCard?.userName));

          const company =
            webCard?.isMultiUser && webCard?.commonInformation?.company
              ? webCard?.commonInformation?.company
              : contactCard.company;
          if (company) {
            vCard.addCompany(company);
          }

          const qrcodeData = vCard.toString();
          return {
            qrcodeData,
            primaryColor: webCard?.cardColors?.primary || '#45444b',
            dark: webCard?.cardColors?.dark || colors.black,
            isMultiUser: webCard?.isMultiUser,
            name: webCard?.userName,
            firstName: contactCard.firstName,
            lastName: contactCard.lastName,
            title: contactCard.title,
            compagny: company || null,
            isPremium: webCard?.isPremium,
            id: webCard.id,
          };
        })
        .filter(isDefined) || []
    );
  }, []);

  const defaultIndex = useMemo(() => {
    if (!profileInfos?.webCardId) return 0;
    const foundVCardId = vcardList.findIndex(
      vcard => vcard.id === profileInfos?.webCardId,
    );
    return foundVCardId === -1 ? 0 : foundVCardId;
  }, [profileInfos?.webCardId, vcardList]);

  const userNames = useMemo(
    () => vcardList.map(({ name }) => name || ''),
    [vcardList],
  );

  const gradientColors = useMemo(
    () =>
      vcardList.length === 0
        ? [['#45444b', colors.black]]
        : vcardList.map(({ primaryColor, dark }) => [primaryColor, dark]),
    [vcardList],
  );

  const currentIndexSharedValue = useSharedValue(0);

  const qrCodeContainerleft = (windowWidth - qrCodeContainerSize) / 2;

  const renderItem = ({ item }: renderItemProps) => {
    const vCard = item;
    const webCard = {
      cardColors: { primary: vCard.primaryColor },
      commonInformation: { company: vCard.compagny || null },
      isMultiUser: vCard.isMultiUser,
      userName: vCard.name,
    };

    const contactCard = {
      company: vCard.compagny || null,
      firstName: vCard.firstName || null,
      lastName: vCard.lastName || null,
      title: vCard.title || null,
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

  const keyExtractor = (webCard: vCardData) => webCard.name;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const index = event.contentOffset.x / (itemWidth + halfMargin);
      currentIndexSharedValue.value = index;
      runOnJS(setCurrentIndex)(Math.round(index));
    },
  });

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: itemWidth + halfMargin,
      offset: (itemWidth + halfMargin) * index,
      index,
    }),
    [halfMargin, itemWidth],
  );
  const snapToOffsets = useMemo(
    () => vcardList.map((_, index) => (itemWidth + halfMargin) * index),
    [halfMargin, itemWidth, vcardList],
  );

  const readableColors = useMemo(
    () =>
      vcardList.length === 0
        ? [colors.white]
        : vcardList.map(card => {
            return card?.primaryColor
              ? getTextColor(card?.primaryColor)
              : colors.white;
          }) || [],
    [vcardList],
  );

  const colorValue = useIndexInterpolation<string>(
    currentIndexSharedValue,
    readableColors,
    colors.white,
    interpolateColor,
  );

  const isPremium = useIndexInterpolation(
    currentIndexSharedValue,
    vcardList.map(card => (card?.isPremium ? 1 : 0) as number),
    0,
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
          {vcardList.length > 0 ? (
            <Suspense fallback={null}>
              <QRCode
                width={qrCodeSize}
                value={vcardList[currentIndex]?.qrcodeData}
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
            data={vcardList}
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
          style={[styles.progress, { top: -flatListPositionInSwipableZone }]}
        >
          {vcardList.length > 1 ? (
            <PageProgress
              nbPages={vcardList.length}
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
          dark: colors.white,
          light: colors.black,
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
      opaque
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
    backgroundColor: colors.black,
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
}));

export default OfflineVCardScreen;
