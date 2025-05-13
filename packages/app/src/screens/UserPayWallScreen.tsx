import * as Sentry from '@sentry/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  PRORATION_MODE,
} from 'react-native-purchases';
import { commitLocalUpdate, graphql, usePreloadedQuery } from 'react-relay';
import {
  extractSeatsFromSubscriptionId,
  getSubscriptionChangeStatus,
} from '@azzapp/shared/subscriptionHelpers';
import { colors, shadow } from '#theme';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { getAuthState } from '#helpers/authStore';
import { iso8601DurationToDays } from '#helpers/dateHelpers';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import relayScreen from '#helpers/relayScreen';
import useBoolean from '#hooks/useBoolean';
import { useMultiUserUpdate } from '#hooks/useMultiUserUpdate';
import useScreenInsets from '#hooks/useScreenInsets';
import { useUserSubscriptionOffer } from '#hooks/useSubscriptionOffer';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableOpacity from '#ui/PressableOpacity';
import SwitchLabel from '#ui/SwitchLabel';
import Text from '#ui/Text';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { UserPayWallScreenQuery } from '#relayArtifacts/UserPayWallScreenQuery.graphql';
import type { UserPayWallRoute } from '#routes';
import type {
  MakePurchaseResult,
  PurchasesPackage,
} from 'react-native-purchases';

const TERMS_OF_SERVICE =
  Platform.OS === 'ios'
    ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
    : process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.PRIVACY_POLICY;
const width = Dimensions.get('screen').width;

const userPayWallScreenQuery = graphql`
  query UserPayWallScreenQuery {
    currentUser {
      id
      userSubscription {
        id
        subscriptionId
        issuer
        status
        availableSeats
        totalSeats
        subscriptionPlan
      }
      isPremium
    }
  }
`;

const UserPayWallScreen = ({
  route,
  preloadedQuery,
}: RelayScreenProps<UserPayWallRoute, UserPayWallScreenQuery>) => {
  const data = usePreloadedQuery(userPayWallScreenQuery, preloadedQuery);
  const intl = useIntl();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { bottom } = useScreenInsets();
  const [period, setPeriod] = useState<'month' | 'year'>(
    data.currentUser?.userSubscription?.subscriptionPlan === 'monthly'
      ? 'month'
      : 'year',
  );
  const [selectedPurchasePackage, setSelectedPurchasePackage] =
    useState<PurchasesPackage | null>(null);
  const [processing, setProcessing] = useState(false);
  const subscriptions = useUserSubscriptionOffer(period);
  const [freeTrialEligible, setFreeTrialEligible] = useState(false);
  const onCompleted = useCallback(() => {
    setProcessing(false);
    router.back();
  }, [router]);
  const setAllowMultiUser = useMultiUserUpdate(onCompleted);

  const lottieHeight = height - BOTTOM_HEIGHT + 20;

  const currentSubscription = useMemo(() => {
    return data.currentUser?.userSubscription;
  }, [data.currentUser?.userSubscription]);

  // this concept comes from Francois and Mickael, i am not responsible
  const [shouldWaitDatabase, startWaitDatabase] = useBoolean(false);

  const [waitedSubscriptionId, setWaitedSubscriptionId] = useState<
    string | null
  >(null);

  const paywallVisible =
    !data.currentUser?.isPremium ||
    (data.currentUser?.isPremium &&
      ((data.currentUser?.userSubscription?.issuer === 'google' &&
        Platform.OS === 'android') ||
        (data.currentUser?.userSubscription?.issuer === 'apple' &&
          Platform.OS === 'ios')));

  useEffect(() => {
    if (
      shouldWaitDatabase &&
      currentSubscription?.subscriptionId === waitedSubscriptionId
    ) {
      setAllowMultiUser(true);
    }
  }, [
    currentSubscription,
    router,
    setAllowMultiUser,
    shouldWaitDatabase,
    waitedSubscriptionId,
  ]);

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      //set the period

      if (currentSubscription) {
        const found = subscriptions.find(
          sub => sub.product.identifier === currentSubscription?.subscriptionId,
        );
        if (found) {
          setSelectedPurchasePackage(found);
        } else {
          setSelectedPurchasePackage(subscriptions[0]);
        }
      } else {
        setSelectedPurchasePackage(subscriptions[0]);
      }

      Purchases.checkTrialOrIntroductoryPriceEligibility([
        subscriptions[0].product.identifier,
      ]).then(trial => {
        if (
          trial[subscriptions[0].product.identifier].status ===
          INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
        ) {
          setFreeTrialEligible(true);
        }
      });
    }
  }, [currentSubscription, currentSubscription?.subscriptionId, subscriptions]);

  const [labelPurchase, setLabelPurchase] = useState<string>(
    intl.formatMessage({
      defaultMessage: 'SUBSCRIBE',
      description: 'MultiUser subscription button label trial not available',
    }),
  );

  useEffect(() => {
    if (
      selectedPurchasePackage?.product.introPrice?.period &&
      freeTrialEligible
    ) {
      //get duration of the trial
      setLabelPurchase(
        intl.formatMessage(
          {
            defaultMessage: 'START MY {days}-DAY TRIAL',
            description: 'MultiUser subscription button label trial available',
          },
          {
            days: iso8601DurationToDays(
              selectedPurchasePackage.product.introPrice.period,
            ),
          },
        ),
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
  }, [freeTrialEligible, intl, selectedPurchasePackage]);

  const activateMultiUser = route.params?.activateFeature === 'MULTI_USER';

  const processOrder = useCallback(async () => {
    if (!selectedPurchasePackage) {
      return;
    }
    try {
      setProcessing(true);
      let res: MakePurchaseResult | null = null;
      if (
        !currentSubscription ||
        currentSubscription?.status !== 'active' ||
        Platform.OS !== 'android'
      ) {
        //no upgrande or downgrade becasue the user as not active subscription
        res = await Purchases.purchasePackage(selectedPurchasePackage!);
      } else {
        //only for android
        const isUpgrade = getSubscriptionChangeStatus(
          currentSubscription?.subscriptionId,
          selectedPurchasePackage.product.identifier,
          currentSubscription?.subscriptionPlan === 'monthly' ? 'P1M' : 'P1Y',
          selectedPurchasePackage.product.subscriptionPeriod,
        );
        try {
          res = await Purchases.purchasePackage(
            selectedPurchasePackage!,
            null,
            {
              oldProductIdentifier: currentSubscription.subscriptionId.replace(
                ':base',
                '',
              ),
              prorationMode:
                isUpgrade === -1
                  ? PRORATION_MODE.DEFERRED
                  : PRORATION_MODE.IMMEDIATE_WITH_TIME_PRORATION,
            },
          );
        } catch (error) {
          Sentry.captureException(error);
        }
      }
      // Update Relay cache temporary
      if (res && res.customerInfo.entitlements.active?.multiuser?.isActive) {
        const { productIdentifier, productPlanIdentifier } =
          res.customerInfo.entitlements.active.multiuser;
        let subscriptionId = productIdentifier;
        if (productPlanIdentifier) {
          //specific to android, we  want to use the official identifier with :{basePlan} instead of fixing the identifier manually
          subscriptionId = `${productIdentifier}:${productPlanIdentifier}`;
        }
        setWaitedSubscriptionId(subscriptionId);
        const newTotalSeat = extractSeatsFromSubscriptionId(subscriptionId);
        const currentTotalSeat = currentSubscription?.totalSeats ?? 0;
        const updateAvailableSeats = Math.max(
          0,
          newTotalSeat -
            currentTotalSeat +
            (currentSubscription?.availableSeats ?? 0),
        );
        if (updateAvailableSeats >= 0 && activateMultiUser) {
          startWaitDatabase();
          return;
        }
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
  }, [
    activateMultiUser,
    currentSubscription,
    intl,
    router,
    selectedPurchasePackage,
    startWaitDatabase,
  ]);

  const restorePurchase = useCallback(async () => {
    const { profileInfos } = getAuthState();
    const restore = await Purchases.restorePurchases();
    if (restore.entitlements.active?.multiuser?.isActive) {
      commitLocalUpdate(getRelayEnvironment(), store => {
        if (profileInfos?.webCardId) {
          store.get(profileInfos.webCardId)?.setValue(true, 'isPremium');
        }
        const user = store.getRoot().getLinkedRecord('currentUser');
        const profiles = user?.getLinkedRecords('profiles');

        if (profiles) {
          const profile = profiles?.find(
            profile => profile.getDataID() === profileInfos?.profileId,
          );
          profile?.getLinkedRecord('webCard')?.setValue(true, 'isPremium');
        }
      });
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={[{ width, height: width }, styles.featureContainer]}>
        <View
          key="subscription_page_1"
          style={[{ width, height: lottieHeight }, styles.promoContainer]}
        >
          <LottieView
            source={require('../assets/paywall/paywall_azzapp_step1.json')}
            autoPlay
            loop
            hardwareAccelerationAndroid
            style={{ position: 'absolute', width, height: lottieHeight }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.95)']}
            locations={[0, 1]}
            style={{
              height: height - BOTTOM_HEIGHT + 130,
              width,

              position: 'absolute',
            }}
            pointerEvents="none"
          />
          <View style={styles.containerPromo}>
            <Text variant="xlarge" style={styles.titlePromo}>
              <FormattedMessage
                defaultMessage="Try azzapp{plus} for free!"
                description="UserPaywall Screen - Try azzapp+ for free"
                values={{
                  plus: (
                    <Text variant="xlarge" style={{ color: colors.red400 }}>
                      +
                    </Text>
                  ),
                }}
              />
            </Text>
            <View style={styles.containerTextPromo}>
              <Icon
                icon="check"
                size={18}
                style={{ tintColor: colors.white }}
              />
              <Text variant="button" style={styles.textPromo}>
                <FormattedMessage
                  defaultMessage="Multi-User"
                  description="UserPaywall Screen - Multi-User"
                />
              </Text>
            </View>
            <View style={styles.containerTextPromo}>
              <Icon
                icon="check"
                size={18}
                style={{ tintColor: colors.white }}
              />
              <Text variant="button" style={styles.textPromo}>
                <FormattedMessage
                  defaultMessage="Unlimited AI Scans"
                  description="UserPaywall Screen - Unlimited AI Scans"
                />
              </Text>
            </View>
            <View style={styles.containerTextPromo}>
              <Icon
                icon="check"
                size={18}
                style={{ tintColor: colors.white }}
              />
              <Text variant="button" style={styles.textPromo}>
                <FormattedMessage
                  defaultMessage="Unlimited WebCards"
                  description="UserPaywall Screen - Unlimited WebCards"
                />
              </Text>
            </View>
            <View style={styles.containerTextPromo}>
              <Icon
                icon="check"
                size={18}
                style={{ tintColor: colors.white }}
              />
              <Text variant="button" style={styles.textPromo}>
                <FormattedMessage
                  defaultMessage="Pro Business Cards"
                  description="UserPaywall Screen - Pro Business Cards"
                />
              </Text>
            </View>
            <View style={styles.containerTextPromo}>
              <Icon
                icon="check"
                size={18}
                style={{ tintColor: colors.white }}
              />
              <Text variant="button" style={styles.textPromo}>
                <FormattedMessage
                  defaultMessage="Email signature"
                  description="UserPaywall Screen - Email signature"
                />
              </Text>
            </View>
          </View>
        </View>
      </View>
      <IconButton
        icon="arrow_down"
        style={styles.icon}
        iconStyle={styles.iconStyle}
        variant="icon"
        onPress={router.back}
        size={50}
      />
      <View style={styles.content}>
        {paywallVisible ? (
          <>
            <View style={styles.containerLogo}>
              <Image
                source={require('#assets/logo-full.png')}
                resizeMode="contain"
                style={styles.plusImage}
              />
              <PremiumIndicator size={17} isRequired />
            </View>
            <SwitchLabel
              variant="small"
              appearance="light"
              value={period === 'year'}
              labelPosition="left"
              onValueChange={() =>
                setPeriod(period === 'year' ? 'month' : 'year')
              }
              label={intl.formatMessage({
                defaultMessage: 'Yearly billing (30% off)',
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
                style={styles.buttonSubscribe}
                appearance="light"
                onPress={processOrder}
              />
              <Text variant="small" style={styles.subTitleText}>
                {currentSubscription?.status !== 'active' &&
                selectedPurchasePackage?.product.introPrice?.period ? (
                  <FormattedMessage
                    defaultMessage="{days}-day free trial, with auto renew. Cancel anytime"
                    description="MultiUser subscription subtitle for inactive subscription"
                    values={{
                      days: iso8601DurationToDays(
                        selectedPurchasePackage.product.introPrice.period,
                      ),
                    }}
                  />
                ) : currentSubscription?.status === 'active' ? (
                  <FormattedMessage
                    defaultMessage="Your actual subscription : {qty, plural,
        =1 {{qty} user}
        other {{qty} Users}
      } billed {period}"
                    description="Paywall subscription subtitle for active subscription"
                    values={{
                      qty: currentSubscription?.totalSeats,
                      period:
                        currentSubscription?.subscriptionPlan === 'yearly'
                          ? intl.formatMessage({
                              defaultMessage: 'yearly',
                              description:
                                'UserPaywall Screen - yearly billing - period',
                            })
                          : currentSubscription?.subscriptionPlan === 'monthly'
                            ? intl.formatMessage({
                                defaultMessage: 'monthly',
                                description:
                                  'UserPaywall Screen - monthly billing - period',
                              })
                            : '',
                    }}
                  />
                ) : null}
              </Text>
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
          </>
        ) : (
          <View style={styles.viewCantSubscribe}>
            <View style={{ ...shadow({ appearance: 'light' }) }}>
              <Icon
                icon={
                  data.currentUser?.userSubscription?.issuer === 'google'
                    ? 'play_store_square'
                    : data.currentUser?.userSubscription?.issuer === 'apple'
                      ? 'app_store_square'
                      : 'webazzapp_square'
                }
                size={53}
                style={{ marginBottom: 30 }}
              />
            </View>
            {data.currentUser?.userSubscription?.issuer === 'web' && (
              <Text variant="medium" style={styles.textOtherDevice}>
                <FormattedMessage
                  defaultMessage="You already have an active subscription through azzapp user management platform. To manage or cancel it, visit users.azzapp.com and sign in to your account"
                  description="UserPayWall - message when a web subscription already exist web"
                />
              </Text>
            )}
            {data.currentUser?.userSubscription?.issuer === 'google' && (
              <Text variant="medium" style={styles.textOtherDevice}>
                <FormattedMessage
                  defaultMessage="You already have an active subscription through Google Play. To manage or cancel it, visit play.google.com and sign in to your Google account"
                  description="UserPayWall - message when a web subscription already exist google"
                />
              </Text>
            )}
            {data.currentUser?.userSubscription?.issuer === 'apple' && (
              <Text variant="medium" style={styles.textOtherDevice}>
                <FormattedMessage
                  defaultMessage="You already have an active subscription via Apple. To manage or cancel it, log in to your Apple account at appleid.apple.com"
                  description="UserPayWall - message when a web subscription already exist apple"
                />
              </Text>
            )}
          </View>
        )}
      </View>

      {processing && (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/loader.json')}
            autoPlay
            loop
            hardwareAccelerationAndroid
            style={{ width: width / 2, height: width / 2, marginTop: -100 }}
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

export default relayScreen(UserPayWallScreen, {
  query: userPayWallScreenQuery,
  pollInterval: 500,
  getScreenOptions: () => ({
    stackPresentation: 'fullScreenModal',
    stackAnimation: 'slide_from_bottom',
  }),
});

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
        styles.selectionItem,
        { overflow: 'visible' },
        selectedPurchasePackage?.identifier === offer.identifier && {
          borderColor: colors.red400,
        },
      ]}
    >
      <Text variant="button" appearance="light">
        <FormattedMessage
          defaultMessage={`{qty, plural,
            =1 {Multi-User}
            other {Multi-User for {qty} Users}
          }`}
          description="MultiUser Paywall Screen - number of seat offer"
          values={{
            qty: parseInt(offer.product.identifier.split('.').pop() ?? '0', 10),
          }}
        />
      </Text>
      <View>
        <Text variant="button" appearance="light">
          <FormattedNumber
            value={offer.product.price}
            style="currency"
            currency={offer.product.currencyCode}
          />
          {period === 'year' ? (
            <FormattedMessage
              defaultMessage=" / year"
              description="MultiUser Paywall Screen - number of seat offer per year"
            />
          ) : (
            <FormattedMessage
              defaultMessage=" / month"
              description="MultiUser Paywall Screen - number of seat offer per month"
            />
          )}
        </Text>

        {period === 'year' && (
          <Text variant="smallbold" style={styles.yearlyPricing}>
            <FormattedNumber
              value={offer.product.price / 12}
              style="currency"
              currency={offer.product.currencyCode}
            />
            <FormattedMessage
              defaultMessage=" / month"
              description="MultiUser Paywall Screen - number of seat offer per month"
            />
          </Text>
        )}
      </View>
    </PressableOpacity>
  );
};

const Offer = memo(OfferItem);
const BOTTOM_HEIGHT = 450;
const styles = StyleSheet.create({
  textOtherDevice: { textAlign: 'center', color: colors.black },
  viewCantSubscribe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
    marginBottom: 50,
  },
  containerPromo: {
    position: 'absolute',
    top: 0,
    width,
    gap: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerTextPromo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  yearlyPricing: { textAlign: 'right', color: colors.grey600 },
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
  titlePromo: { color: colors.white, textAlign: 'center', lineHeight: 40 },
  textPromo: { color: colors.white, textAlign: 'center' },
  containerLogo: { flexDirection: 'row', height: 34, marginBottom: 15 },
  plusImage: { height: 34 },
  featureContainer: { flex: 1, marginBottom: -20, aspectRatio: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  priceItem: {
    flexDirection: 'row',
    height: 54,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'space-between',
    flex: 1,

    marginBottom: 10,
  },
  selectionItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'white',
    ...shadow({ appearance: 'light', direction: 'center' }),
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
  descriptionText: { color: colors.grey400 },
  subTitleText: { textAlign: 'center', color: colors.black },
  icon: {
    backgroundColor: colors.black,
    position: 'absolute',
    top: 50,
    right: 15,
  },
  iconStyle: { tintColor: colors.white },
  buttonSubscribe: { width: '100%', marginTop: 5 },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  bottomContainer: {
    paddingHorizontal: 30,
    gap: 10,
    width: '100%',
    overflow: 'visible',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
