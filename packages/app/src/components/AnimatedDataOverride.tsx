import { useState } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  type DerivedValue,
} from 'react-native-reanimated';

const AnimatedDataOverride = <T extends object>({
  data,
  animatedData,
  children,
}: {
  data: T;
  animatedData: Omit<DerivedValue<Readonly<Partial<T>>>, 'set'>;
  children: (data: T) => React.ReactNode;
}) => {
  const [override, setOverride] = useState<Partial<T>>({});

  useAnimatedReaction(
    () => animatedData.value,
    value => {
      runOnJS(setOverride)(value);
    },
    [animatedData],
  );

  return children({ ...data, ...override });
};

export default AnimatedDataOverride;
