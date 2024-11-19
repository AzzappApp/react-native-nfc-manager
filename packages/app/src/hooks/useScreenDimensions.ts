/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export default function useScreenDimensions(): ScaledSize {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('screen'));
  useEffect(() => {
    function handleChange({ screen }: { screen: ScaledSize }) {
      if (
        dimensions.width !== screen.width ||
        dimensions.height !== screen.height ||
        dimensions.scale !== screen.scale ||
        dimensions.fontScale !== screen.fontScale
      ) {
        setDimensions(screen);
      }
    }
    const subscription = Dimensions.addEventListener('change', handleChange);
    // We might have missed an update between calling `get` in render and
    // `addEventListener` in this handler, so we set it here. If there was
    // no change, React will filter out this update as a no-op.
    handleChange({ screen: Dimensions.get('screen') });
    return () => {
      subscription.remove();
    };
  }, [dimensions]);
  return dimensions;
}
