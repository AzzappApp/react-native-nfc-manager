import { useCallback } from 'react';
import {
  runOnJS,
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

// This code is transposed from https://github.com/facebook/react-native/blob/184b295a019e2af6712d34276c741e0dae78f798/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/common/ShakeDetector.java#L45
const GRAVITY_EARTH = 9.80665;
const REQUIRED_FORCE = GRAVITY_EARTH * 1.8;
const COOL_DOWN_TIME = 3000; // 3 seconds

const atLeastRequiredForce = (a: number) => {
  'worklet';
  return Math.abs(a) > REQUIRED_FORCE;
};

export const useShakeDetector = (callback: () => void, activated = true) => {
  const lastShakeTimestamp = useSharedValue(0);
  const lastCallbackTimestamp = useSharedValue(0);
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

  const maybeDispatchShake = useCallback(
    (timestamp: number) => {
      'worklet';
      const coolDown = COOL_DOWN_TIME;
      if (timestamp - lastCallbackTimestamp.value < coolDown) {
        return;
      }

      if (numShakes.value >= 8) {
        reset();
        lastCallbackTimestamp.value = timestamp;
        runOnJS(callback)();
      }

      if (timestamp - lastShakeTimestamp.value > 3000) {
        reset();
      }
    },
    [callback, lastShakeTimestamp, lastCallbackTimestamp, numShakes, reset],
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

  const resetCoolDown = useCallback(() => {
    'worklet';
    lastCallbackTimestamp.value = 0;
    reset();
  }, [lastCallbackTimestamp, reset]);

  return resetCoolDown;
};
