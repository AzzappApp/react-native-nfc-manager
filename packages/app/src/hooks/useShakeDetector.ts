import {
  runOnJS,
  SensorType,
  useAnimatedSensor,
  useSharedValue,
  useDerivedValue,
} from 'react-native-reanimated';

const GRAVITY_EARTH = 9.80665;
const SHAKE_FORCE_THRESHOLD = 12; // m/s² more than gravity
const SHAKE_WINDOW_MS = 500; // window to detect the shake
const REQUIRED_SHAKE_COUNT = 3; // number of shakes
const COOLDOWN_MS = 1000;

export const useShakeDetector = (callback: () => void, activated = true) => {
  const lastTrigger = useSharedValue(0);
  const shakeTimestamps = useSharedValue<number[]>([]);

  const sensor = useAnimatedSensor(SensorType.ACCELEROMETER);

  useDerivedValue(() => {
    if (!activated) return;

    const now = Date.now();
    const { x, y, z } = sensor.sensor.value;

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const delta = Math.abs(magnitude - GRAVITY_EARTH);

    if (delta > SHAKE_FORCE_THRESHOLD) {
      shakeTimestamps.value.push(now);

      shakeTimestamps.value = shakeTimestamps.value.filter(
        t => now - t < SHAKE_WINDOW_MS,
      );

      if (
        shakeTimestamps.value.length >= REQUIRED_SHAKE_COUNT &&
        now - lastTrigger.value > COOLDOWN_MS
      ) {
        lastTrigger.value = now;
        shakeTimestamps.value = [];
        runOnJS(callback)();
      }
    }
  }, [activated]);
};
