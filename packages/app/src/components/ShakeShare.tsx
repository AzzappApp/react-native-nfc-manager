import { BlurView } from 'expo-blur';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Directions,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import {
  SensorType,
  runOnJS,
  useAnimatedReaction,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useClientQuery } from 'react-relay';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import useAuthState from '#hooks/useAuthState';
import useLatestCallback from '#hooks/useLatestCallback';
import ActivityIndicator from '#ui/ActivityIndicator';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import CoverRenderer from './CoverRenderer';
import type { ShakeShareScreenQuery } from '#relayArtifacts/ShakeShareScreenQuery.graphql';

const ShakeShare = () => {
  const [mountScreen, setMountScreen] = useState(false);
  const { profileInfos } = useAuthState();

  const dismount = useCallback(() => {
    setMountScreen(false);
  }, []);

  useShakeDetector(() => {
    if (profileInfos && profileInfos.profileRole !== 'invited') {
      setMountScreen(true);
    }
  });

  //Gesture to close on swipe

  const fling = Gesture.Fling()
    .direction(Directions.DOWN)
    .runOnJS(true)
    .onEnd(dismount);

  if (!mountScreen) {
    return null;
  }
  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GestureDetector gesture={fling}>
        <BlurView intensity={27} tint="dark" style={styles.blurView}>
          <SafeAreaView style={styles.safeArea}>
            <Suspense
              fallback={
                <View style={styles.activityIndicatorContainer}>
                  <ActivityIndicator color="white" />
                </View>
              }
            >
              <ShakeShareDisplay onClose={dismount} />
            </Suspense>
          </SafeAreaView>
        </BlurView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default ShakeShare;

const ShakeShareDisplay = ({ onClose }: { onClose: () => void }) => {
  const { profileInfos } = useAuthState();
  const { node } = useClientQuery<ShakeShareScreenQuery>(
    graphql`
      query ShakeShareScreenQuery($profileId: ID!) {
        node(id: $profileId) {
          ... on Profile @alias(as: "profile") {
            webCard {
              userName
              ...CoverRenderer_webCard
            }
            serializedContactCard {
              data
              signature
            }
          }
        }
      }
    `,
    {
      profileId: profileInfos?.profileId ?? '',
    },
  );

  const profile = node?.profile;

  const contactCardUrl = useMemo(() => {
    if (!profile?.serializedContactCard) {
      return null;
    }
    const { data, signature } = profile.serializedContactCard;
    return buildUserUrlWithContactCard(
      profile.webCard.userName,
      data,
      signature,
    );
  }, [profile?.serializedContactCard, profile?.webCard]);

  const { width } = useWindowDimensions();
  return (
    <>
      <Header
        leftElement={
          <IconButton
            icon="close"
            variant="icon"
            onPress={onClose}
            iconStyle={styles.iconStyle}
          />
        }
        middleElement={
          <Text variant="large" style={styles.headerTitle}>
            <FormattedMessage
              defaultMessage={'Share your information'}
              description={'Shake share screen header title'}
            />
          </Text>
        }
        style={styles.headerStyle}
      />
      <View style={styles.container}>
        <CoverRenderer
          width={width / 2.5}
          webCard={profile?.webCard}
          style={styles.coverStyle}
          animationEnabled={true}
        />
        {contactCardUrl && (
          <QRCode
            value={contactCardUrl}
            size={width * 0.6}
            color={colors.white}
            backgroundColor="transparent"
            ecl="L"
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  blurView: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(14, 18, 22, 0.95)',
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStyle: { backgroundColor: 'transparent' },
  iconStyle: { tintColor: colors.white },
  coverStyle: { marginBottom: 50 },
  headerTitle: { color: colors.white },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

// This code is transposed from https://github.com/facebook/react-native/blob/184b295a019e2af6712d34276c741e0dae78f798/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/common/ShakeDetector.java#L45
const GRAVITY_EARTH = 9.80665;
const REQUIRED_FORCE = GRAVITY_EARTH * 1.8;

const atLeastRequiredForce = (a: number) => {
  'worklet';
  return Math.abs(a) > REQUIRED_FORCE;
};

const useShakeDetector = (callback: () => void) => {
  const lastShakeTimestamp = useSharedValue(0);
  const numShakes = useSharedValue(0);
  const accelX = useSharedValue(0);
  const accelY = useSharedValue(0);
  const accelZ = useSharedValue(0);

  const reset = () => {
    'worklet';
    lastShakeTimestamp.value = 0;
    numShakes.value = 0;
    accelX.value = 0;
    accelY.value = 0;
    accelZ.value = 0;
  };

  const gyroscope = useAnimatedSensor(SensorType.ACCELEROMETER);

  const recordShake = (timestamp: number) => {
    'worklet';
    lastShakeTimestamp.value = timestamp;
    numShakes.value++;
  };

  const callbackRef = useLatestCallback(callback);
  const maybeDispatchShake = (timeStamp: number) => {
    'worklet';
    if (numShakes.value >= 8) {
      reset();
      runOnJS(callbackRef)();
    }

    if (timeStamp - lastShakeTimestamp.value > 3000) {
      reset();
    }
  };

  const sensorValue = useDerivedValue(() => {
    const { x, y, z } = gyroscope.sensor.value;
    return {
      ax: x,
      ay: y,
      az: z,
    };
  });

  useAnimatedReaction(
    () => sensorValue.value,
    ({ ax, ay, az }) => {
      const timeStamp = Date.now();

      if (atLeastRequiredForce(ax) && ax * accelX.value <= 0) {
        recordShake(timeStamp);
        accelX.value = ax;
      } else if (atLeastRequiredForce(ay) && ay * accelY.value <= 0) {
        recordShake(timeStamp);
        accelX.value = ay;
      } else if (atLeastRequiredForce(az) && az * accelZ.value <= 0) {
        recordShake(timeStamp);
        accelX.value = az;
      }

      maybeDispatchShake(timeStamp);
    },
  );
};
