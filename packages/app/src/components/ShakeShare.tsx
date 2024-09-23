/* eslint-disable no-bitwise */
import {
  BlendColor,
  Canvas,
  Group,
  ImageSVG,
  Paint,
  Skia,
  fitbox,
  rect,
} from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Directions,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  SensorType,
  runOnJS,
  useAnimatedReaction,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { graphql, useClientQuery } from 'react-relay';
import { colors } from '#theme';
import useAuthState from '#hooks/useAuthState';
import useLatestCallback from '#hooks/useLatestCallback';
import { get as qrCodeWidth } from '#relayProviders/qrCodeWidth.relayprovider';
import ActivityIndicator from '#ui/ActivityIndicator';
import IconButton from '#ui/IconButton';
import CoverRenderer from './CoverRenderer';
import type { ShakeShareScreenQuery } from '#relayArtifacts/ShakeShareScreenQuery.graphql';

const ShakeShare = () => {
  const [mountScreen, setMountScreen] = useState(false);
  const { profileInfos } = useAuthState();

  const dismount = useCallback(() => {
    setMountScreen(false);
  }, []);

  const hasProfile = !!(profileInfos && profileInfos.profileRole !== 'invited');

  const activateDetector = useCallback(() => {
    setMountScreen(true);
  }, []);

  useShakeDetector(activateDetector, hasProfile);

  //Gesture to close on swipe
  const fling = Gesture.Fling()
    .direction(Directions.DOWN | Directions.RIGHT)
    .runOnJS(true)
    .onBegin(dismount); //seems to be a bug, only work with onBegin

  if (!mountScreen) {
    return null;
  }
  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GestureDetector gesture={fling}>
        <View style={styles.safeArea}>
          <Suspense
            fallback={
              <View style={styles.activityIndicatorContainer}>
                <ActivityIndicator color="white" />
              </View>
            }
          >
            <ShakeShareDisplay onClose={dismount} />
          </Suspense>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default ShakeShare;

const { width } = Dimensions.get('window');

const QR_CODE_WIDTH = Math.round(width * 0.6);

const ShakeShareDisplay = ({ onClose }: { onClose: () => void }) => {
  const { profileInfos } = useAuthState();

  const { node } = useClientQuery<ShakeShareScreenQuery>(
    graphql`
      query ShakeShareScreenQuery($profileId: ID!, $width: Int!) {
        node(id: $profileId) {
          ... on Profile @alias(as: "profile") {
            webCard {
              cardIsPublished
              userName
              ...CoverRenderer_webCard
            }
            contactCardQrCode(width: $width)
          }
        }
      }
    `,
    {
      profileId: profileInfos?.profileId ?? '',
      width: qrCodeWidth(),
    },
  );

  const profile = node?.profile;

  useEffect(() => {
    if (!profile?.webCard?.cardIsPublished) {
      onClose();
    }
  }, [onClose, profile?.webCard?.cardIsPublished]);

  const svg = profile?.contactCardQrCode
    ? Skia.SVG.MakeFromString(profile?.contactCardQrCode)
    : null;

  const src = rect(0, 0, svg?.width() ?? 0, svg?.height() ?? 0);
  const dst = rect(0, 0, QR_CODE_WIDTH, QR_CODE_WIDTH);

  if (!profile?.webCard?.cardIsPublished) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <CoverRenderer
          width={width}
          webCard={profile?.webCard}
          style={styles.coverStyle}
          canPlay={true}
        />
        <LinearGradient
          colors={['rgba(14, 18, 22,0)', 'rgba(0, 0, 0, 1)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0.22, 0.66]}
          style={styles.linear}
        />
        {svg && (
          <View style={styles.qrCodeContainer}>
            <Canvas style={styles.canvas}>
              <Group
                layer={
                  <Paint>
                    <BlendColor color="white" mode="srcATop" />
                  </Paint>
                }
                transform={fitbox('contain', src, dst)}
              >
                <ImageSVG svg={svg} />
              </Group>
            </Canvas>
          </View>
        )}

        <IconButton
          icon="close"
          onPress={onClose}
          iconStyle={styles.iconStyle}
          style={styles.iconContainerStyle}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  iconContainerStyle: {
    position: 'absolute',
    bottom: 35,
    borderColor: 'white',
  },
  qrCodeContainer: {
    backgroundColor: 'black',
    position: 'absolute',
    borderRadius: 34,
    padding: 17,
    bottom: 123,
  },
  canvas: { width: QR_CODE_WIDTH, height: QR_CODE_WIDTH },
  linear: {
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.black,
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStyle: { backgroundColor: 'transparent' },
  iconStyle: {
    tintColor: colors.white,
  },
  coverStyle: { marginBottom: 50, borderRadius: 0 },
  headerTitle: { color: colors.white },
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
});

// This code is transposed from https://github.com/facebook/react-native/blob/184b295a019e2af6712d34276c741e0dae78f798/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/common/ShakeDetector.java#L45
const GRAVITY_EARTH = 9.80665;
const REQUIRED_FORCE = GRAVITY_EARTH * 1.8;

const atLeastRequiredForce = (a: number) => {
  'worklet';
  return Math.abs(a) > REQUIRED_FORCE;
};

const useShakeDetector = (callback: () => void, activated: boolean) => {
  const lastShakeTimestamp = useSharedValue(0);
  const numShakes = useSharedValue(0);
  const accelX = useSharedValue(0);
  const accelY = useSharedValue(0);
  const accelZ = useSharedValue(0);

  const reset = useCallback(() => {
    'worklet';
    lastShakeTimestamp.value = 0;
    numShakes.value = 0;
    accelX.value = 0;
    accelY.value = 0;
    accelZ.value = 0;
  }, [accelX, accelY, accelZ, lastShakeTimestamp, numShakes]);

  const gyroscope = useAnimatedSensor(SensorType.ACCELEROMETER);

  const recordShake = useCallback(
    (timestamp: number) => {
      'worklet';
      lastShakeTimestamp.value = timestamp;
      numShakes.value++;
    },
    [lastShakeTimestamp, numShakes],
  );

  const callbackRef = useLatestCallback(callback);
  const maybeDispatchShake = useCallback(
    (timeStamp: number) => {
      'worklet';
      if (numShakes.value >= 8) {
        reset();
        runOnJS(callbackRef)();
      }

      if (timeStamp - lastShakeTimestamp.value > 3000) {
        reset();
      }
    },
    [callbackRef, lastShakeTimestamp.value, numShakes.value, reset],
  );

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
      if (activated) {
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
      }
    },
    [activated],
  );
};
