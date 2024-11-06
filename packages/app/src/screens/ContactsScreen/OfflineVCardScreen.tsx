import { addEventListener } from '@react-native-community/netinfo';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import VCard from 'vcard-creator';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
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
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import { PageProgress } from '#ui/WizardPagerHeader';
import OfflineHeader from './OfflineHeader';
import type { HomeScreenContext_user$data } from '#relayArtifacts/HomeScreenContext_user.graphql';
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

  useEffect(() => {
    // Subscribe
    const unsubscribe = addEventListener(state => {
      setCanLeaveScreen(!!state.isConnected);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const vcardList: vCardData[] = useMemo(() => {
    const offlineData: HomeScreenContext_user$data = getOfflineVCard();

    return (
      offlineData?.profiles
        ?.map(data => {
          const contactCard = data.contactCard as ContactCard;
          const webCard = data.webCard;
          if (!webCard || !webCard.cardIsPublished) return undefined;
          const vCard = new VCard();
          const name =
            `${contactCard.firstName} ${contactCard.lastName}`.trim();
          if (name.length) {
            vCard.addName(name);
          }

          contactCard.phoneNumbers?.forEach(number => {
            if (number.selected)
              vCard.addPhoneNumber(number.number, number.label || '');
          });
          contactCard.emails?.forEach(email => {
            if (email.selected)
              vCard.addEmail(email.address, email.label || '');
          });
          contactCard.urls?.forEach(url => {
            if (url.selected) vCard.addURL(url.address);
          });

          if (webCard?.isMultiUser) {
            webCard?.commonInformation?.phoneNumbers?.forEach(number => {
              vCard.addPhoneNumber(number.number, number.label || '');
            });
            webCard?.commonInformation?.emails?.forEach(email => {
              vCard.addEmail(email.address, email.label || '');
            });
            webCard?.commonInformation?.urls?.forEach(url => {
              vCard.addURL(url.address);
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

  const primaryColors = useMemo(
    () =>
      vcardList.length === 0
        ? [colors.black]
        : vcardList.map(({ primaryColor }) => primaryColor),
    [vcardList],
  );
  const userNames = useMemo(
    () => vcardList.map(({ name }) => name || ''),
    [vcardList],
  );

  const darkColors = useMemo(
    () =>
      vcardList.length === 0
        ? [colors.black]
        : vcardList.map(({ dark }) => dark),
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
      const index = event.contentOffset.x / itemWidth;
      currentIndexSharedValue.value = index;
      runOnJS(setCurrentIndex)(Math.round(index));
    },
  });

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: itemWidth + itemMargin,
      offset: (itemWidth + itemMargin) * index,
      index,
    }),
    [itemMargin, itemWidth],
  );
  const snapToOffsets = useMemo(
    () =>
      vcardList.map((_, index) => (itemWidth + itemMargin / 2) * (index + 1)),
    [itemMargin, itemWidth, vcardList],
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

  const inputRange = useDerivedValue(
    () => Array.from({ length: readableColors.length ?? 0 }, (_, i) => i),
    [readableColors.length],
  );

  const colorValue = useDerivedValue<string>(() => {
    const currentProfileIndex = currentIndexSharedValue.value;
    if (inputRange.value.length > 1) {
      return interpolateColor(
        currentProfileIndex,
        inputRange.value,
        readableColors,
      );
    }
    if (readableColors.length > 0) {
      return readableColors[0];
    }
    return colors.white;
  }, [readableColors]);

  const animatedIconsColor = useAnimatedStyle(() => {
    return { tintColor: colorValue.value };
  });

  const intl = useIntl();
  const offlineText = intl.formatMessage({
    defaultMessage: 'Offline mode',
    description: 'offline mode screen - header description',
  });

  const offlineModeText = useDerivedValue(() => offlineText);

  const renderSeparator = () => <View style={{ width: itemMargin / 2 }} />;

  const contentContainerStyle = {
    top: flatListPositionInSwipableZone,
    paddingStart: itemMargin,
    paddingEnd: itemMargin,
    height: itemHeight,
  };

  return (
    <Container style={styles.container}>
      <SafeAreaView
        style={styles.container}
        edges={{ bottom: 'off', top: 'additive' }}
      >
        <HomeBackgroundComponent
          primaryColors={primaryColors}
          darkColors={darkColors}
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
              isPremium={!!vcardList[currentIndex]?.isPremium}
              currentIndexSharedValue={currentIndexSharedValue}
              readableColors={readableColors}
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
            snapToInterval={itemWidth}
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
          <PageProgress
            nbPages={vcardList.length}
            currentPage={currentIndex}
            appearance="dark"
          />
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
