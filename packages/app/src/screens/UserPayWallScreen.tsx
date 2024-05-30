import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Purchases from 'react-native-purchases';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import { useUserSubscriptionOffer } from '#hooks/useSubscriptionOffer';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableOpacity from '#ui/PressableOpacity';
import SwitchLabel from '#ui/SwitchLabel';
import Text from '#ui/Text';
import type { ScreenOptions } from '#components/NativeRouter';
import type { PurchasesPackage } from 'react-native-purchases';
import type { SharedValue } from 'react-native-reanimated';

const TERMS_OF_SERVICE = process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.TERMS_OF_SERVICE;

const UserPayWallScreen = () => {
  const intl = useIntl();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { bottom } = useScreenInsets();
  const [period, setPeriod] = useState<'month' | 'year'>('year');
  const [selectedPurchasePackage, setSelectedPurchasePackage] =
    useState<PurchasesPackage | null>(null);

  const subscriptions = useUserSubscriptionOffer(period);

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      setSelectedPurchasePackage(subscriptions[0]);
    }
  }, [subscriptions]);

  const processOrder = useCallback(async () => {
    if (selectedPurchasePackage) {
      await Purchases.purchasePackage(selectedPurchasePackage!);
      //TODO ??e have to update the local cache of relay
      // once the server notification is received, the database will be updated , and ... we don't have realtime so the local cache update will required
      //polling is not usable here, because it will refresh the pagination list of multiuser(will cause a bad UX experience)
    }
  }, [selectedPurchasePackage]);

  //const [currentPage, setCurrentPage] = useState(2);
  const currentIndex = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const index = event.contentOffset.x / width;
      currentIndex.value = Math.max(Math.min(4, index), 0);
    },
  });

  return (
    <View style={styles.container}>
      <View style={[{ width }, styles.featureContainer]}>
        <Animated.ScrollView
          horizontal
          snapToInterval={width}
          decelerationRate="fast"
          snapToAlignment="start"
          onScroll={onScroll}
          pagingEnabled
          scrollEnabled
          contentContainerStyle={{ width: 4 * width }}
        >
          <View
            key="subscription_page_1"
            style={[
              {
                backgroundColor: 'red',
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
                backgroundColor: 'blue',
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
      <View style={styles.content}>
        <View style={styles.contaienrLogo}>
          <Image
            source={require('#assets/logo-full_dark.png')}
            resizeMode="contain"
            style={styles.plusImage}
          />
          <Icon icon="plus" size={17} />
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
                <PressableOpacity
                  key={offer.identifier}
                  onPress={() => setSelectedPurchasePackage(offer)}
                  style={[
                    styles.priceItem,
                    { overflow: 'visible' },
                    selectedPurchasePackage?.identifier ===
                      offer.identifier && {
                      borderColor: colors.red400,
                    },
                  ]}
                >
                  <Text variant="button">
                    <FormattedMessage
                      defaultMessage={'{qty} users'}
                      description="MultiUser Paywall Screen - number of seat offer"
                      values={{
                        qty: parseInt(
                          offer.identifier.split('_').pop() ?? '0',
                          10,
                        ),
                      }}
                    />
                  </Text>
                  <View>
                    <Text variant="button">{offer.product.priceString}</Text>
                    {period === 'year' && (
                      <Text variant="smallbold" style={{ textAlign: 'right' }}>
                        {(offer.product.price / 12).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </PressableOpacity>
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
            label={intl.formatMessage({
              defaultMessage: 'START MY 7-DAY TRIAL',
              description: 'MultiUser subscription button label',
            })}
            style={[styles.buttonSubscribe, { width: '100%' }]}
            onPress={processOrder}
          />
          <View style={styles.footer}>
            <PressableOpacity
              onPress={() => Linking.openURL(`${TERMS_OF_SERVICE}`)}
            >
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
    </View>
  );
};

UserPayWallScreen.getScreenOptions = (): ScreenOptions => ({
  replaceAnimation: 'push',
  stackAnimation: 'slide_from_bottom',
});

const CIRCLE_SIZE = 5;
const BOTTOM_HEIGHT = 414;

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

const styles = StyleSheet.create({
  promoContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingBottom: 47,
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
  plusImage: { height: 34, marginRight: 4 },
  containerPager: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    height: 30,
  },
  featureContainer: { flex: 1, marginBottom: -20 },
  container: { backgroundColor: colors.black, flex: 1 },
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
  titleText: { paddingTop: 20 },
  contentContainerStyle: {
    marginHorizontal: 20,
    paddingTop: 15,
    overflow: 'visible',
  },
  scrollViewStyle: { width: '100%' },
  content: {
    height: BOTTOM_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    overflow: 'visible',
    paddingTop: 20,
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
});
