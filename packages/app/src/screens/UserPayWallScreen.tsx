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
import {
  commitLocalUpdate,
  graphql,
  usePreloadedQuery,
  useRelayEnvironment,
} from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { getAuthState } from '#helpers/authStore';
import { iso8601DurationToDays } from '#helpers/dateHelpers';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import relayScreen from '#helpers/relayScreen';
import { useMultiUserUpdate } from '#hooks/useMultiUserUpdate';
import useScreenInsets from '#hooks/useScreenInsets';
import { useUserSubscriptionOffer } from '#hooks/useSubscriptionOffer';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import PressableOpacity from '#ui/PressableOpacity';
import SwitchLabel from '#ui/SwitchLabel';
import Text from '#ui/Text';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { UserPayWallScreenQuery } from '#relayArtifacts/UserPayWallScreenQuery.graphql';
import type { UserPayWallRoute } from '#routes';
import type { PurchasesPackage } from 'react-native-purchases';

const TERMS_OF_SERVICE = process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.PRIVACY_POLICY;
const width = Dimensions.get('screen').width;
/** @type {*} */
const userPayWallcreenQuery = graphql`
  query UserPayWallScreenQuery {
    currentUser {
      id
      userSubscription {
        subscriptionId
        status
        availableSeats
        totalSeats
      }
    }
  }
`;

const UserPayWallScreen = ({
  route,
  preloadedQuery,
}: RelayScreenProps<UserPayWallRoute, UserPayWallScreenQuery>) => {
  const environment = useRelayEnvironment();
  const data = usePreloadedQuery(userPayWallcreenQuery, preloadedQuery);
  const intl = useIntl();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { bottom } = useScreenInsets();
  const [period, setPeriod] = useState<'month' | 'year'>(
    data.currentUser?.userSubscription?.subscriptionId.includes('month')
      ? 'month'
      : 'year',
  );
  const [selectedPurchasePackage, setSelectedPurchasePackage] =
    useState<PurchasesPackage | null>(null);
  const [processing, setProcessing] = useState(false);
  const subscriptions = useUserSubscriptionOffer(period);
  const [freeTrialEligible, setFreeTrialEligible] = useState(false);
  const setAllowMultiUser = useMultiUserUpdate();

  const lottieHeight = height - BOTTOM_HEIGHT + 20;

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      //set the period
      if (data.currentUser?.userSubscription) {
        const found = subscriptions.find(
          sub =>
            sub.product.identifier ===
            data.currentUser?.userSubscription?.subscriptionId,
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
  }, [
    data.currentUser?.userSubscription,
    data.currentUser?.userSubscription?.subscriptionId,
    subscriptions,
  ]);

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

  const processOrder = useCallback(async () => {
    const { profileInfos } = getAuthState();
    const webCardId = profileInfos?.webCardId;
    if (!selectedPurchasePackage || !webCardId) {
      return;
    }
    try {
      setProcessing(true);

      const res = await Purchases.purchasePackage(selectedPurchasePackage!);
      // Update Relay cache temporary
      if (res.customerInfo.entitlements.active?.multiuser?.isActive) {
        const subscriptionId =
          res.customerInfo.entitlements.active?.multiuser.productIdentifier;
        const newTotalSeat = extractSeatsFromSubscriptionId(subscriptionId);
        const currentTotalSeat =
          data.currentUser?.userSubscription?.totalSeats ?? 0;
        const updateAvailableSeats = Math.max(
          0,
          newTotalSeat -
            currentTotalSeat +
            (data.currentUser?.userSubscription?.availableSeats ?? 0),
        );

        commitLocalUpdate(environment, store => {
          try {
            if (profileInfos?.webCardId && updateAvailableSeats >= 0) {
              //activate only in there is enough seeats
              const userSubscriptionCache = store.create(
                subscriptionId,
                'UserSubscription',
              );
              userSubscriptionCache.setValue(
                updateAvailableSeats,
                'availableSeats',
              );
              userSubscriptionCache.setValue(subscriptionId, 'subscriptionId');
              userSubscriptionCache.setValue(subscriptionId, 'id');
              userSubscriptionCache.setValue('active', 'status');
              userSubscriptionCache.setValue('apple', 'issuer');

              const webCardStore = store.get(profileInfos.webCardId);
              webCardStore?.setValue(true, 'isPremium');
              const subStore = webCardStore?.getLinkedRecord('subscription');
              if (!subStore) {
                webCardStore?.setLinkedRecord(
                  userSubscriptionCache,
                  'subscription',
                );
              } else {
                subStore?.setValue(updateAvailableSeats, 'availableSeats');
                subStore.setValue(subscriptionId, 'subscriptionId');
                subStore.setValue('active', 'status');
                subStore.setValue('apple', 'issuer');
              }

              //subscription is created on the webcard, we will use this one as reference
              const upSubscriptionCache = store
                ?.get(profileInfos.webCardId)
                ?.getLinkedRecord('subscription');
              if (upSubscriptionCache) {
                const user = store.getRoot().getLinkedRecord('currentUser');
                const profiles = user?.getLinkedRecords('profiles');
                if (profiles) {
                  const profile = profiles?.find(
                    profile => profile.getDataID() === profileInfos?.profileId,
                  );
                  if (
                    !profile
                      ?.getLinkedRecord('webCard')
                      ?.getLinkedRecord('subscription')
                  ) {
                    // Link the new UserSubscription record to the webCard
                    profile
                      ?.getLinkedRecord('webCard')
                      ?.setLinkedRecord(upSubscriptionCache, 'subscription');
                  }
                }
              }
            }
          } catch (error) {
            Sentry.captureException(error, {
              data: 'userPayWallScreen-updating cache',
            });
          }
        });
        if (
          updateAvailableSeats >= 0 &&
          route.params?.activateFeature === 'MULTI_USER'
        ) {
          setAllowMultiUser(true);
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
    data.currentUser?.userSubscription?.availableSeats,
    data.currentUser?.userSubscription?.totalSeats,
    environment,
    intl,
    route.params?.activateFeature,
    router,
    selectedPurchasePackage,
    setAllowMultiUser,
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
              defaultMessage="Unlock multi-user to give contact card to all your team"
              description="UserPaywall Screen - message promo section"
            />
          </Text>
        </View>
      </View>
      <IconButton
        icon="arrow_down"
        style={styles.icon}
        variant="icon"
        onPress={() => router.back()}
        size={50}
      />
      <View style={styles.content}>
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
          appearance="light"
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
            style={styles.buttonSubscribe}
            appearance="light"
            onPress={processOrder}
          />
          <Text variant="small" style={styles.subTitleText}>
            {data.currentUser?.userSubscription?.status !== 'active' &&
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
            ) : (
              <FormattedMessage
                defaultMessage="Your actual subscription : {qty, plural,
        =1 {{qty} user}
        other {{qty} Users}
      } billed {period}"
                description="sdfsdf"
                values={{
                  qty: parseInt(
                    data.currentUser?.userSubscription?.subscriptionId
                      .split('.')
                      .pop() ?? '0',
                    10,
                  ),
                  period:
                    data.currentUser?.userSubscription?.subscriptionId.includes(
                      'year',
                    )
                      ? 'yearly'
                      : 'monthly',
                }}
              />
            )}
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

export default relayScreen(UserPayWallScreen, {
  query: userPayWallcreenQuery,
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
        { overflow: 'visible' },
        selectedPurchasePackage?.identifier === offer.identifier && {
          borderColor: colors.red400,
        },
      ]}
    >
      <Text variant="button" appearance="light">
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
        <Text variant="button" appearance="light">
          <FormattedNumber
            value={offer.product.price}
            style="currency"
            currency={offer.product.currencyCode}
          />
          {period !== 'year' ? (
            <FormattedMessage
              defaultMessage=" / month"
              description="MultiUser Paywall Screen - number of seat offer"
            />
          ) : undefined}
        </Text>
        {period === 'year' && (
          <Text variant="smallbold" style={styles.monthlyPricing}>
            <FormattedNumber
              value={offer.product.price / 12}
              style="currency"
              currency={offer.product.currencyCode}
            />
            <FormattedMessage
              defaultMessage=" / month"
              description="MultiUser Paywall Screen - number of seat offer"
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
  },
  subTitleText: {
    textAlign: 'center',
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

function extractSeatsFromSubscriptionId(id: string) {
  const parts = id.split('.');
  const number = parts.pop();
  if (number) {
    return parseInt(number, 10);
  }
  return 0;
}
