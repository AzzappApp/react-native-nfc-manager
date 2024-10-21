import SkiaPictureViewNativeComponent from '@shopify/react-native-skia/src/specs/SkiaPictureViewNativeComponent';
import { SkiaViewApi } from '@shopify/react-native-skia/src/views/api';

import { useEffect, useMemo } from 'react';
import { PixelRatio, View } from 'react-native';
import {
  useAnimatedReaction,
  type DerivedValue,
} from 'react-native-reanimated';
import type {
  SkiaPictureViewProps,
  SkPicture,
} from '@shopify/react-native-skia';
import type { StyleProp, ViewStyle } from 'react-native';

const NativeSkiaPictureView = SkiaPictureViewNativeComponent;

export type SkiaAnimatedPictureView = Omit<SkiaPictureViewProps, 'picture'> & {
  picture: DerivedValue<SkPicture | null>;
  width: number;
  height: number;
  imageStyle?: StyleProp<ViewStyle>;
};

let idHelper = 10000;

const SkiaAnimatedPictureView = ({
  picture,
  onSize,
  debug,
  mode,
  width,
  height,
  style,
  imageStyle,
  ...viewProps
}: SkiaAnimatedPictureView) => {
  const nativeId = useMemo(() => idHelper++, []);

  useEffect(() => {
    SkiaViewApi.setJsiProperty(nativeId, 'onSize', onSize);
  }, [onSize, nativeId]);

  useAnimatedReaction(
    () => picture.value,
    picture => {
      SkiaViewApi.setJsiProperty(nativeId, 'picture', picture);
    },
    [picture, nativeId],
  );

  const pixelRatio = PixelRatio.get();

  // I can't understand why react-native-skia doesn't handle pixelRatio by itself
  return (
    <View {...viewProps} style={[style, { width, height }]}>
      <NativeSkiaPictureView
        collapsable={false}
        nativeID={`${nativeId}`}
        mode={mode ?? 'default'}
        debug={debug}
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: width * pixelRatio,
            height: height * pixelRatio,
            transformOrigin: 'top left',
            transform: [{ scaleX: 1 / pixelRatio }, { scaleY: 1 / pixelRatio }],
          },
          imageStyle,
        ]}
      />
    </View>
  );
};

export default SkiaAnimatedPictureView;
