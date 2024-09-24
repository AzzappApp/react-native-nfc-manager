import * as Sentry from '@sentry/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { memo, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Purchases, { INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { commitLocalUpdate } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { getAuthState } from '#helpers/authStore';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import { useMultiUserUpdate } from '#hooks/useMultiUserUpdate';
import useScreenInsets from '#hooks/useScreenInsets';
import { useUserSubscriptionOffer } from '#hooks/useSubscriptionOffer';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import PressableOpacity from '#ui/PressableOpacity';
import SwitchLabel from '#ui/SwitchLabel';
import Text from '#ui/Text';
import type {
  NativeScreenProps,
  ScreenOptions,
} from '#components/NativeRouter';
import type { UserPayWallRoute } from '#routes';
import type { PurchasesPackage } from 'react-native-purchases';
import type { SharedValue } from 'react-native-reanimated';

const TERMS_OF_SERVICE = process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.PRIVACY_POLICY;
const width = Dimensions.get('screen').width;

const UserPayWallScreen = ({ route }: NativeScreenProps<UserPayWallRoute>) => {
  const intl = useIntl();
  const router = useRouter();
  const { height } = useWindowDimensions();

  const { bottom } = useScreenInsets();
  const lottieHeight = height - BOTTOM_HEIGHT + 20;
  const [period, setPeriod] = useState<'month' | 'year'>('year');
  const [selectedPurchasePackage, setSelectedPurchasePackage] =
    useState<PurchasesPackage | null>(null);
  const [processing, setProcessing] = useState(false);

  const subscriptions = useUserSubscriptionOffer(period);

  const setAllowMultiUser = useMultiUserUpdate();

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      setSelectedPurchasePackage(subscriptions[0]);
    }
  }, [subscriptions]);

  const [labelPurchase, setLabelPurchase] = useState<string>(
    intl.formatMessage({
      defaultMessage: 'CONTINUE',
      description: 'MultiUser subscription button label trial not available',
    }),
  );

  useEffect(() => {
    if (selectedPurchasePackage) {
      Purchases.checkTrialOrIntroductoryPriceEligibility([
        selectedPurchasePackage?.identifier,
      ]).then(trial => {
        if (
          trial[selectedPurchasePackage.identifier].status ===
          INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
        ) {
          setLabelPurchase(
            intl.formatMessage({
              defaultMessage: 'START MY 7-DAY TRIAL',
              description:
                'MultiUser subscription button label trial available',
            }),
          );
        } else {
          setLabelPurchase(
            intl.formatMessage({
              defaultMessage: 'CONTINUE',
              description:
                'MultiUser subscription button label trial not available',
            }),
          );
        }
      });
    }
  }, [intl, selectedPurchasePackage]);

  const processOrder = useCallback(async () => {
    const { profileInfos } = getAuthState();
    if (selectedPurchasePackage && profileInfos) {
      try {
        setProcessing(true);

        const res = await Purchases.purchasePackage(selectedPurchasePackage!);
        // Update Relay cache temporary
        if (res.customerInfo.entitlements.active?.multiuser?.isActive) {
          if (route.params?.activateFeature === 'MULTI_USER') {
            setAllowMultiUser(true);
          }
          commitLocalUpdate(getRelayEnvironment(), store => {
            store.get(profileInfos.webCardId)?.setValue(true, 'isPremium');
          });
        }
        setProcessing(false);
        router.back();
      } catch (error) {
        //display error message
        setProcessing(false);
        //@ts-expect-error error code is not in the type
        const errorCode = error?.code;
        if (errorCode === '6') {
          //This product is already active for the user
          return;
        }
        if (errorCode === '1') {
          //purchase was cancelled
          return;
        }
        if (errorCode === '7') {
          // There is already another active subscriber using the same receipt.
          Alert.alert(
            intl.formatMessage({
              defaultMessage: 'Error during processing payment',
              description: 'Title of the payment process error alert',
            }),
            intl.formatMessage({
              defaultMessage:
                'There is already a subscription from your Apple or Google account associated to another azzapp account. You need to cancel the subscription from the other account to proceed.',
              description: 'Description of the payment process error alert',
            }),
          );
          return;
        }

        Alert.alert(
          intl.formatMessage({
            defaultMessage: 'Error during processing payment',
            description: 'Title of the payment process error alert',
          }),
          intl.formatMessage({
            defaultMessage:
              'There was an error during the payment process, please try again later.',
            description: 'Description of the payment process error alert',
          }),
        );
        Sentry.captureException(error, { data: 'userPayWallScreen' });
      }
    }
  }, [
    intl,
    route.params?.activateFeature,
    router,
    selectedPurchasePackage,
    setAllowMultiUser,
  ]);

  //const [currentPage, setCurrentPage] = useState(2);
  const currentIndex = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const index = event.contentOffset.x / width;
      currentIndex.value = Math.max(Math.min(4, index), 0);
    },
  });

  const restorePurchase = useCallback(async () => {
    const { profileInfos } = getAuthState();
    const restore = await Purchases.restorePurchases();
    if (restore.entitlements.active?.multiuser?.isActive) {
      commitLocalUpdate(getRelayEnvironment(), store => {
        if (profileInfos)
          store.get(profileInfos.webCardId)?.setValue(true, 'isPremium');
      });
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={[{ width, height: width }, styles.featureContainer]}>
        <Animated.ScrollView
          horizontal
          snapToInterval={width}
          decelerationRate="fast"
          snapToAlignment="start"
          onScroll={onScroll}
          pagingEnabled
          scrollEnabled
          style={{ width }}
          contentContainerStyle={{ width: 4 * width }}
        >
          <View
            key="subscription_page_1"
            style={[
              {
                width,
                height: lottieHeight,
              },
              styles.promoContainer,
            ]}
          >
            <LottieView
              source={require('../assets/paywall/paywall_azzapp_step1.json')}
              autoPlay
              loop
              hardwareAccelerationAndroid
              style={{
                position: 'absolute',
                width,
                height: lottieHeight,
              }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.9)']}
              locations={[0, 1]}
              style={{
                height: height - BOTTOM_HEIGHT + 130,
                width,
                position: 'absolute',
              }}
              pointerEvents="none"
            />
            <Text variant="xlarge" style={styles.textPromo}>
              <FormattedMessage
                defaultMessage="Add as many sections as you want to your WebCard"
                description="UserPaywall Screen - message promo section"
              />
            </Text>
          </View>
          <View
            key="subscription_page_2"
            style={[
              {
                backgroundColor: 'green',
                width,
              },
              styles.promoContainer,
            ]}
            //missing content from design team
          >
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.9)']}
              locations={[0, 1]}
              style={{
                height: height - BOTTOM_HEIGHT + 130,
                width,
                position: 'absolute',
              }}
              pointerEvents="none"
            />
            <Text variant="xlarge" style={styles.textPromo}>
              <FormattedMessage
                defaultMessage="Choose from 600+ stunning templates"
                description="UserPaywall Screen - message promo template"
              />
            </Text>
          </View>
          <View
            key="subscription_page_3"
            style={[
              {
                width,
              },
              styles.promoContainer,
            ]}
            //missing content from design team
          >
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.9)']}
              locations={[0, 1]}
              style={{
                height: height - BOTTOM_HEIGHT + 130,
                width,
                position: 'absolute',
              }}
              pointerEvents="none"
            />
            <Text variant="xlarge" style={styles.textPromo}>
              <FormattedMessage
                defaultMessage="Explore hundred of sections type"
                description="UserPaywall Screen - message promo  type"
              />
            </Text>
          </View>
          <View
            key="subscription_page_4"
            style={[
              {
                backgroundColor: 'orange',
                width,
              },
              styles.promoContainer,
            ]}
            //missing content from design team
          >
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.9)']}
              locations={[0, 1]}
              style={{
                height: height - BOTTOM_HEIGHT + 130,
                width,
                position: 'absolute',
              }}
              pointerEvents="none"
            />
            <Text variant="xlarge" style={styles.textPromo}>
              <FormattedMessage
                defaultMessage="Elevate your cover with our suggested media"
                description="UserPaywall Screen - message promo suggested media"
              />
            </Text>
          </View>
        </Animated.ScrollView>

        <View style={[styles.containerPager, { width }]}>
          {Array.from({ length: 4 }).map((_, index) => {
            return (
              <AnimatedTabIndex
                currentIndex={currentIndex}
                index={index}
                key={`PayWallPager-${index}`}
              />
            );
          })}
          <View />
        </View>
      </View>

      <IconButton
        icon="arrow_down"
        style={styles.icon}
        variant="icon"
        onPress={() => router.back()}
        size={50}
      />
      <View style={[styles.content]}>
        <View style={styles.contaienrLogo}>
          <Image
            source={require('#assets/logo-full.png')}
            resizeMode="contain"
            style={styles.plusImage}
          />
          <PremiumIndicator size={17} isRequired />
        </View>
        <SwitchLabel
          variant="small"
          value={period === 'year'}
          labelPosition="left"
          onValueChange={() => setPeriod(period === 'year' ? 'month' : 'year')}
          label={intl.formatMessage({
            defaultMessage: 'Yearly billing',
            description:
              'MultiUser Paywall screen - switch between monthly and yearly billing',
          })}
        />
        <View style={{ flex: 1, width, overflow: 'visible' }}>
          <ScrollView
            style={styles.scrollViewStyle}
            contentContainerStyle={styles.contentContainerStyle}
          >
            {subscriptions.map(offer => {
              return (
                <Offer
                  key={offer.identifier}
                  offer={offer}
                  period={period}
                  selectedPurchasePackage={selectedPurchasePackage}
                  setSelectedPurchasePackage={setSelectedPurchasePackage}
                />
              );
            })}
          </ScrollView>
          <LinearGradient
            colors={[
              colors.white,
              'rgba(255, 255, 255, 0.00) ',
              'rgba(255, 255, 255, 0.00)',
              colors.white,
            ]}
            locations={[0, 0.1149, 0.8716, 1]}
            style={{
              height: '100%',
              width,
              position: 'absolute',
              paddingBottom: 5,
            }}
            pointerEvents="none"
          />
        </View>
        <View style={[styles.bottomContainer, { paddingBottom: bottom }]}>
          <Button
            label={labelPurchase}
            style={[styles.buttonSubscribe, { width: '100%' }]}
            onPress={processOrder}
          />
          <View style={styles.footer}>
            <PressableOpacity onPress={restorePurchase}>
              <Text variant="medium" style={styles.descriptionText}>
                <FormattedMessage
                  defaultMessage="Restore Purchases"
                  description="MultiUser subscription restore purchases link"
                />
              </Text>
            </PressableOpacity>
            <Text variant="medium" style={styles.descriptionText}>
              |
            </Text>
            <PressableOpacity
              onPress={() => Linking.openURL(`${TERMS_OF_SERVICE}`)}
            >
              <Text variant="medium" style={styles.descriptionText}>
                <FormattedMessage
                  defaultMessage="Terms of use"
                  description="MultiUser subscription Terms of use link"
                />
              </Text>
            </PressableOpacity>
            <Text variant="medium" style={styles.descriptionText}>
              |
            </Text>
            <PressableOpacity
              onPress={() => Linking.openURL(`${PRIVACY_POLICY}`)}
            >
              <Text variant="medium" style={styles.descriptionText}>
                <FormattedMessage
                  defaultMessage="Privacy"
                  description="MultiUser subscription Privacy link"
                />
              </Text>
            </PressableOpacity>
          </View>
        </View>
      </View>
      {processing && (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/loader.json')}
            autoPlay
            loop
            hardwareAccelerationAndroid
            style={{
              width: width / 2,
              height: width / 2,
              marginTop: -100,
            }}
          />
          <Text variant="button" style={styles.text}>
            <FormattedMessage
              defaultMessage="Processing payment"
              description="UserPayWall - Processing loading screen"
            />
          </Text>
        </View>
      )}
    </View>
  );
};

UserPayWallScreen.getScreenOptions = (): ScreenOptions => ({
  replaceAnimation: 'push',
  stackAnimation: 'slide_from_bottom',
});

const CIRCLE_SIZE = 5;

export default UserPayWallScreen;

type AnimatedTabIndexProps = {
  currentIndex: SharedValue<number>;
  index: number;
};
const AnimatedTabIndex = ({ currentIndex, index }: AnimatedTabIndexProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      currentIndex.value,
      [index - 1, index, index + 1],
      [colors.grey200, colors.white, colors.grey300],
    );
    return {
      backgroundColor: color,
      width: interpolate(
        currentIndex.value,
        [index - 1, index, index + 1],
        [CIRCLE_SIZE, 20, CIRCLE_SIZE],
      ),
    };
  });

  return (
    <Animated.View
      accessibilityRole="none"
      accessibilityState={{ selected: index === currentIndex.value }}
      style={[styles.pagerItem, animatedStyle]}
    />
  );
};

type OfferItemProps = {
  offer: PurchasesPackage;
  setSelectedPurchasePackage: (offer: PurchasesPackage) => void;
  selectedPurchasePackage: PurchasesPackage | null;
  period: 'month' | 'year';
};

const OfferItem = ({
  offer,
  setSelectedPurchasePackage,
  selectedPurchasePackage,
  period,
}: OfferItemProps) => {
  const selectOffer = useCallback(
    () => setSelectedPurchasePackage(offer),
    [offer, setSelectedPurchasePackage],
  );
  return (
    <PressableOpacity
      key={offer.identifier}
      onPress={selectOffer}
      style={[
        styles.priceItem,
        { overflow: 'visible' },
        selectedPurchasePackage?.identifier === offer.identifier && {
          borderColor: colors.red400,
        },
      ]}
    >
      <Text variant="button">
        <FormattedMessage
          defaultMessage={`{qty, plural,
            =1 {{qty} User}
            other {{qty} Users}
          }`}
          description="MultiUser Paywall Screen - number of seat offer"
          values={{
            qty: parseInt(offer.product.identifier.split('.').pop() ?? '0', 10),
          }}
        />
      </Text>
      <View>
        <Text variant="button">
          <FormattedNumber
            value={offer.product.price}
            style="currency"
            currency={offer.product.currencyCode}
          />
        </Text>
        {period === 'year' && (
          <Text variant="smallbold" style={styles.monthlyPricing}>
            <FormattedNumber
              value={offer.product.price / 12}
              style="currency"
              currency={offer.product.currencyCode}
            />
            <FormattedMessage
              defaultMessage={' / month'}
              description="MultiUser Paywall Screen - number of seat offer"
            />
          </Text>
        )}
      </View>
    </PressableOpacity>
  );
};

const Offer = memo(OfferItem);
const BOTTOM_HEIGHT = width;
const styles = StyleSheet.create({
  monthlyPricing: { textAlign: 'right', color: colors.grey600 },
  promoContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingBottom: 47,
  },
  text: {
    color: colors.white,
    width: '75%',
    textAlign: 'center',
    lineHeight: 36,
  },
  textPromo: {
    color: colors.white,
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 41,
  },
  contaienrLogo: {
    flexDirection: 'row',
    height: 34,
    marginBottom: 15,
  },
  plusImage: { height: 34 },
  containerPager: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    height: 30,
  },
  featureContainer: { flex: 1, marginBottom: -20, aspectRatio: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  priceItem: {
    flexDirection: 'row',
    height: 54,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: 'white',
    //custom shadow, (this screen has no darmode )
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    paddingHorizontal: 20,
  },
  contentContainerStyle: {
    marginHorizontal: 20,
    paddingTop: 15,
    overflow: 'visible',
  },
  scrollViewStyle: { width: '100%' },
  content: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    overflow: 'visible',
    paddingTop: 20,
    width,
    height: BOTTOM_HEIGHT,
  },
  descriptionText: {
    color: colors.grey400,
    marginTop: 20,
  },
  icon: {
    backgroundColor: colors.grey100,
    position: 'absolute',
    top: 50,
    left: 15,
  },
  buttonSubscribe: {
    width: '100%',
    marginTop: 5,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  bottomContainer: {
    paddingHorizontal: 30,
    width: '100%',
    overflow: 'visible',
  },
  pagerItem: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    marginLeft: CIRCLE_SIZE / 2,
    marginRight: CIRCLE_SIZE / 2,
    backgroundColor: colors.grey200,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
