import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import range from 'lodash/range';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, mixins } from '../../theme';
import type { CropData, ImageEditionParameters } from '../../types';
import type { ComponentType } from 'react';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';
import type { AnimateProps } from 'react-native-reanimated';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

export type CropperProps = {
  mediaSize: { width: number; height: number };
  aspectRatio: number;
  editionParameters?: ImageEditionParameters;
  cropEditionMode?: boolean | null;
  onCropDataChange: (cropData: CropData) => void;
  onDisplayedImageLayout?: (displayedLayout: LayoutRectangle) => void;
};

const withCropMode = <
  P extends Omit<ViewProps, 'children'> & {
    editionParameters?: ImageEditionParameters;
  },
>(
  Component: ComponentType<AnimateProps<P>>,
) => {
  const WrappedComponent = ({
    mediaSize,
    aspectRatio,
    editionParameters,
    cropEditionMode,
    onCropDataChange,
    style,
    ...props
  }: CropperProps & P) => {
    const [componentSize, setComponentSize] = useState<LayoutRectangle | null>(
      null,
    );

    const onLayout = (e: LayoutChangeEvent) => {
      setComponentSize(e.nativeEvent.layout);
    };

    const displayedImageSize = useMemo(() => {
      if (componentSize) {
        if (componentSize.width / componentSize.height > aspectRatio) {
          return {
            width: aspectRatio * componentSize.height,
            height: componentSize.height,
          };
        } else {
          return {
            width: componentSize.width,
            height: componentSize.width / aspectRatio,
          };
        }
      }
      return null;
    }, [aspectRatio, componentSize]);

    const mediaSizeInfos = useMemo(() => {
      const orientationInvertSize =
        !!editionParameters?.orientation &&
        ['LEFT', 'RIGHT', 'LEFT_MIRRORED', 'RIGHT_MIRRORED'].includes(
          editionParameters?.orientation,
        );
      let height = orientationInvertSize ? mediaSize.width : mediaSize.height;
      let width = orientationInvertSize ? mediaSize.height : mediaSize.width;

      const imgQuad = createRect(0, 0, width, height);
      const distance =
        Math.tan(degToRad(FIELD_OF_VIEW / 2)) * Math.max(height, width);
      const cx = width / 2;
      const cy = height / 2;
      const cz = distance;

      // TODO yaw and pitch + z projection seems very approximate
      // it seems to "work" but there is an important delta between
      // the real IOS image quad and the one computed here
      if (editionParameters?.pitch) {
        const pitch = degToRad(editionParameters.pitch);
        const sinY = Math.sin(pitch);
        const cosY = Math.cos(pitch);

        Object.values(imgQuad).forEach(point => {
          const { y, z = 0 } = point;
          point.y = (y - cx) * cosY - (z - cz) * sinY + cx;
          point.z = (y - cx) * sinY + (z - cz) * cosY + cz;
        });
      }
      if (editionParameters?.yaw) {
        const yaw = degToRad(editionParameters.yaw);
        const sinY = Math.sin(-yaw);
        const cosY = Math.cos(-yaw);

        Object.values(imgQuad).forEach(point => {
          const { x, z = 0 } = point;
          point.x = (x - cx) * cosY - (z - cz) * sinY + cx;
          point.z = (x - cx) * sinY + (z - cz) * cosY + cz;
        });
      }
      if (editionParameters?.roll) {
        const roll = degToRad(editionParameters.roll);
        const sinR = Math.sin(-roll);
        const cosR = Math.cos(-roll);

        Object.values(imgQuad).forEach(point => {
          const { x, y } = point;
          point.x = (x - cx) * cosR - (y - cy) * sinR + cx;
          point.y = (x - cx) * sinR + (y - cy) * cosR + cy;
        });
      }

      if (
        editionParameters?.roll ||
        editionParameters?.pitch ||
        editionParameters?.yaw
      ) {
        Object.values(imgQuad).forEach(point => {
          const { x, y, z = 0 } = point;
          const delta = distance / (distance - z);
          point.x = (x - cx) * delta + cx;
          point.y = (y - cy) * delta + cy;
          point.z = 0;
        });
        const minX = Math.min(imgQuad.topLeft.x, imgQuad.bottomLeft.x);
        const minY = Math.min(imgQuad.topLeft.y, imgQuad.topRight.y);
        width = Math.max(imgQuad.topRight.x, imgQuad.bottomRight.x) - minX;
        height = Math.max(imgQuad.bottomLeft.y, imgQuad.bottomRight.y) - minY;

        Object.values(imgQuad).forEach(point => {
          point.x -= minX;
          point.y -= minY;
        });
      }

      return {
        width,
        height,
        imgQuad,
      };
    }, [
      editionParameters?.orientation,
      editionParameters?.pitch,
      editionParameters?.yaw,
      editionParameters?.roll,
      mediaSize.width,
      mediaSize.height,
    ]);

    const cropData = useMemo(
      () =>
        getValidCropdata(
          editionParameters?.cropData,
          aspectRatio,
          mediaSizeInfos.width,
          mediaSizeInfos.height,
          mediaSizeInfos.imgQuad,
        ),
      [editionParameters?.cropData, mediaSizeInfos, aspectRatio],
    );

    useEffect(() => {
      if (!isEqual(cropData, editionParameters?.cropData)) {
        onCropDataChange(cropData);
      }
    }, [cropData, editionParameters?.cropData, onCropDataChange]);

    const cropOriginXSharedValue = useSharedValue(cropData.originX);
    const cropOriginYSharedValue = useSharedValue(cropData.originY);
    const cropOriginWidthSharedValue = useSharedValue(cropData.width);
    const cropOriginHeightSharedValue = useSharedValue(cropData.height);
    useEffect(() => {
      cropOriginXSharedValue.value = cropData.originX;
      cropOriginYSharedValue.value = cropData.originY;
      cropOriginWidthSharedValue.value = cropData.width;
      cropOriginHeightSharedValue.value = cropData.height;
    }, [
      cropData,
      cropOriginHeightSharedValue,
      cropOriginWidthSharedValue,
      cropOriginXSharedValue,
      cropOriginYSharedValue,
    ]);

    const sizeInfosSharedValue = useSharedValue({
      mediaWidth: mediaSizeInfos.width,
      mediaHeight: mediaSizeInfos.height,
      displayedWidth: displayedImageSize?.width ?? 0,
      displayedHeight: displayedImageSize?.height ?? 0,
    });

    useEffect(() => {
      sizeInfosSharedValue.value = {
        mediaWidth: mediaSizeInfos.width,
        mediaHeight: mediaSizeInfos.height,
        displayedWidth: displayedImageSize?.width ?? 0,
        displayedHeight: displayedImageSize?.height ?? 0,
      };
    }, [
      displayedImageSize?.height,
      displayedImageSize?.width,
      mediaSizeInfos.height,
      mediaSizeInfos.width,
      sizeInfosSharedValue,
    ]);

    const gestureContext = useSharedValue({
      offsetX: cropData.originX,
      offsetY: cropData.originY,
      offsetWidth: cropData.width,
      offsetHeight: cropData.height,
    });

    const onGestureStart = () => {
      'worklet';
      gestureContext.value = {
        offsetX: cropData.originX,
        offsetY: cropData.originY,
        offsetWidth: cropData.width,
        offsetHeight: cropData.height,
      };
    };

    const onGestureEnd = useCallback(() => {
      const cropData = getValidCropdata(
        {
          originX: cropOriginXSharedValue.value,
          originY: cropOriginYSharedValue.value,
          width: cropOriginWidthSharedValue.value,
          height: cropOriginHeightSharedValue.value,
        },
        aspectRatio,
        mediaSizeInfos.width,
        mediaSizeInfos.height,
        mediaSizeInfos.imgQuad,
      );

      let animationsNb = 0;
      let animationDones = 0;
      const onAnimationEnd = () => {
        animationDones += 1;
        if (animationDones >= animationsNb) {
          onCropDataChange(cropData);
        }
      };

      const animConfig = {
        duration: 100,
        easing: Easing.ease,
      };

      if (cropOriginXSharedValue.value !== cropData.originX) {
        animationsNb += 1;
        cropOriginXSharedValue.value = withTiming(
          cropData.originX,
          animConfig,
          () => {
            runOnJS(onAnimationEnd)();
          },
        );
      }
      if (cropOriginYSharedValue.value !== cropData.originY) {
        animationsNb += 1;
        cropOriginYSharedValue.value = withTiming(
          cropData.originY,
          animConfig,
          () => {
            runOnJS(onAnimationEnd)();
          },
        );
      }
      if (cropOriginWidthSharedValue.value !== cropData.width) {
        animationsNb += 1;
        cropOriginWidthSharedValue.value = withTiming(
          cropData.width,
          animConfig,
          () => {
            runOnJS(onAnimationEnd)();
          },
        );
      }
      if (cropOriginHeightSharedValue.value !== cropData.height) {
        animationsNb += 1;
        cropOriginHeightSharedValue.value = withTiming(
          cropData.height,
          animConfig,
          () => {
            runOnJS(onAnimationEnd)();
          },
        );
      }
      if (animationsNb === 0) {
        onAnimationEnd();
      }
    }, [
      aspectRatio,
      cropOriginHeightSharedValue,
      cropOriginWidthSharedValue,
      cropOriginXSharedValue,
      cropOriginYSharedValue,
      mediaSizeInfos.height,
      mediaSizeInfos.width,
      mediaSizeInfos.imgQuad,
      onCropDataChange,
    ]);

    const panGesture = Gesture.Pan()
      .maxPointers(1)
      .onStart(onGestureStart)
      .onChange(e => {
        'worklet';
        const { offsetX, offsetY, offsetWidth, offsetHeight } =
          gestureContext.value;

        const { mediaHeight, mediaWidth, displayedHeight, displayedWidth } =
          sizeInfosSharedValue.value;

        const scale =
          mediaWidth / mediaHeight > aspectRatio
            ? displayedHeight / offsetHeight
            : displayedWidth / offsetWidth;

        cropOriginXSharedValue.value = clamp(
          offsetX - e.translationX / scale,
          -offsetWidth / 4,
          mediaWidth - (3 * offsetWidth) / 4,
        );
        cropOriginYSharedValue.value = clamp(
          offsetY - e.translationY / scale,
          -offsetHeight / 2,
          mediaHeight - (3 * offsetHeight) / 4,
        );
      })
      .onFinalize(() => {
        'worklet';
        runOnJS(onGestureEnd)();
      });

    const isAndroid = Platform.OS === 'android';
    const pinchGesture = Gesture.Pinch()
      .onStart(onGestureStart)
      .onChange(e => {
        'worklet';

        const { mediaHeight, mediaWidth } = sizeInfosSharedValue.value;

        const { offsetX, offsetY, offsetHeight, offsetWidth } =
          gestureContext.value;

        cropOriginWidthSharedValue.value = offsetWidth / e.scale;
        cropOriginHeightSharedValue.value = offsetHeight / e.scale;
        if (isAndroid) {
          // android effect doesn't support this kind of downscaling
          cropOriginWidthSharedValue.value = Math.min(
            cropOriginWidthSharedValue.value,
            mediaWidth,
          );
          cropOriginHeightSharedValue.value = Math.min(
            cropOriginHeightSharedValue.value,
            mediaHeight,
          );
        }

        cropOriginXSharedValue.value =
          offsetX - (cropOriginWidthSharedValue.value - offsetWidth) / 2;
        cropOriginYSharedValue.value =
          offsetY - (cropOriginHeightSharedValue.value - offsetHeight) / 2;
      })
      .onFinalize(() => {
        'worklet';
        runOnJS(onGestureEnd)();
      });

    // this is a workaround to avoid a bug in react-native-reanimated
    const editionParametersCopy = omit(editionParameters, 'cropData');
    const animatedProps = useAnimatedProps(() => {
      return {
        editionParameters: {
          ...editionParametersCopy,
          cropData: {
            originX: cropOriginXSharedValue.value,
            originY: cropOriginYSharedValue.value,
            width: cropOriginWidthSharedValue.value,
            height: cropOriginHeightSharedValue.value,
          },
        },
      };
    });

    const image = useMemo(() => {
      if (!displayedImageSize) {
        return null;
      }
      return (
        // @ts-expect-error - Cannot type properly
        <Component
          animatedProps={animatedProps}
          style={displayedImageSize}
          {...props}
        />
      );
    }, [displayedImageSize, animatedProps, props]);

    return (
      <View onLayout={onLayout} style={[style, styles.container]}>
        {image}
        {cropEditionMode && componentSize && displayedImageSize && (
          <GestureDetector gesture={Gesture.Race(pinchGesture, panGesture)}>
            <View
              style={[
                displayedImageSize,
                styles.gridContainer,
                {
                  top: (componentSize.height - displayedImageSize.height) / 2,
                  left: (componentSize.width - displayedImageSize.width) / 2,
                },
              ]}
            >
              <View style={[styles.verticalGrid, displayedImageSize]}>
                {range(0, 4).map(index => (
                  <View key={index} style={styles.verticalLine} />
                ))}
              </View>
              <View style={[styles.horizontalGrid, displayedImageSize]}>
                {range(0, 4).map(index => (
                  <View key={index} style={styles.horizontalLine} />
                ))}
              </View>
            </View>
          </GestureDetector>
        )}
      </View>
    );
  };

  const componentName = Component.displayName ?? Component.name;
  WrappedComponent.diplayName = `withCropMode(${componentName})`;

  return WrappedComponent;
};

export default withCropMode;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    position: 'absolute',
  },
  verticalGrid: {
    ...mixins.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  verticalLine: {
    width: 1,
    backgroundColor: colors.grey,
  },
  horizontalGrid: {
    ...mixins.absoluteFill,
    justifyContent: 'space-between',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: colors.grey,
  },
});

// corresponds to a focal length of 28 mm full frame
// This is an approximation from what seems to work with ios algorithm
const FIELD_OF_VIEW = 77.5;

type Point = {
  x: number;
  y: number;
  z?: number;
};

type Quadrilateral = {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
};

const getValidCropdata = (
  cropData: CropData | null | undefined,
  aspectRatio: number,
  mediaWidth: number,
  mediaHeight: number,
  imgQuad: Quadrilateral,
) => {
  if (
    !cropData ||
    cropData.width > mediaWidth ||
    cropData.height > mediaHeight ||
    // might have slight error due to javascrpt floating number
    Math.abs(cropData.width / cropData.height - aspectRatio) > 0.00001
  ) {
    if (mediaWidth / mediaHeight > aspectRatio) {
      cropData = {
        originX: (mediaWidth - mediaHeight * aspectRatio) / 2,
        originY: 0,
        height: mediaHeight,
        width: mediaHeight * aspectRatio,
      };
    } else {
      cropData = {
        originX: 0,
        originY: (mediaHeight - mediaWidth / aspectRatio) / 2,
        height: mediaWidth / aspectRatio,
        width: mediaWidth,
      };
    }
  }

  const cropRect = createRect(
    cropData.originX,
    cropData.originY,
    cropData.width,
    cropData.height,
  );
  let rectChanged = false;

  const leftLine = linearFunc(imgQuad.topLeft, imgQuad.bottomLeft);
  if (
    cropRect.topLeft.x < leftLine.getX(cropRect.topLeft.y) ||
    cropRect.bottomLeft.x < leftLine.getX(cropRect.bottomLeft.y)
  ) {
    const x = Math.max(
      leftLine.getX(cropRect.topLeft.y),
      leftLine.getX(cropRect.bottomLeft.y),
    );
    translateRectTo(cropRect, { x, y: cropRect.topLeft.y });
    rectChanged = true;
  }

  const topLine = linearFunc(imgQuad.topRight, imgQuad.topLeft);
  if (
    cropRect.topLeft.y < topLine.getY(cropRect.topLeft.x) ||
    cropRect.topRight.y < topLine.getY(cropRect.topRight.x)
  ) {
    const y = Math.max(
      topLine.getY(cropRect.topLeft.x),
      topLine.getY(cropRect.topRight.x),
    );
    translateRectTo(cropRect, { x: cropRect.topLeft.x, y });
    rectChanged = true;
  }

  const rightLine = linearFunc(imgQuad.topRight, imgQuad.bottomRight);
  if (
    cropRect.topRight.x > rightLine.getX(cropRect.topRight.y) ||
    cropRect.bottomRight.x > rightLine.getX(cropRect.bottomRight.y)
  ) {
    const x = Math.min(
      rightLine.getX(cropRect.topRight.y),
      rightLine.getX(cropRect.bottomRight.y),
    );
    const deltaX = x - cropRect.topRight.x;
    if (
      cropRect.topLeft.x + deltaX >= leftLine.getX(cropRect.topLeft.y) &&
      cropRect.bottomLeft.x + deltaX >= leftLine.getX(cropRect.bottomLeft.y)
    ) {
      translateRectTo(cropRect, {
        x: cropRect.topLeft.x + deltaX,
        y: cropRect.topLeft.y,
      });
    } else {
      cropRect.topRight.x = x;
      cropRect.bottomRight.x = x;
    }
    rectChanged = true;
  }

  const bottomLine = linearFunc(imgQuad.bottomLeft, imgQuad.bottomRight);
  if (
    cropRect.bottomRight.y > bottomLine.getY(cropRect.bottomRight.x) ||
    cropRect.bottomLeft.y > bottomLine.getY(cropRect.bottomLeft.x)
  ) {
    const y = Math.min(
      bottomLine.getY(cropRect.bottomRight.x),
      bottomLine.getY(cropRect.bottomLeft.x),
    );

    const deltaY = y - cropRect.bottomRight.y;
    if (
      cropRect.topLeft.y + deltaY >= topLine.getY(cropRect.topLeft.x) &&
      cropRect.topRight.y + deltaY >= topLine.getY(cropRect.topRight.x)
    ) {
      translateRectTo(cropRect, {
        x: cropRect.topLeft.x,
        y: cropRect.topLeft.y + deltaY,
      });
    } else {
      cropRect.bottomRight.y = y;
      cropRect.bottomLeft.y = y;
    }
    rectChanged = true;
  }

  if (rectChanged) {
    let { width, height } = rectSize(cropRect);
    if (width / height > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }
    cropData = {
      originX: cropRect.topLeft.x,
      originY: cropRect.topLeft.y,
      width,
      height,
    };
  }
  return cropData;
};

const createRect = (
  x: number,
  y: number,
  width: number,
  height: number,
): Quadrilateral => ({
  topLeft: { x, y },
  topRight: { x: x + width, y },
  bottomLeft: { x, y: y + height },
  bottomRight: { x: x + width, y: y + height },
});

const translateRectTo = (rect: Quadrilateral, { x, y }: Point) => {
  const { width, height } = rectSize(rect);
  rect.topLeft = { x, y };
  rect.topRight = { x: x + width, y };
  rect.bottomRight = { x: x + width, y: y + height };
  rect.bottomLeft = { x, y: y + height };
};

const rectSize = ({ topLeft, topRight, bottomLeft }: Quadrilateral) => ({
  width: topRight.x - topLeft.x,
  height: bottomLeft.y - topLeft.y,
});

const linearFunc = (p1: Point, p2: Point) => {
  const slope = (p2.y - p1.y) / (p2.x - p1.x);
  const yIntercept = p1.y - slope * p1.x;
  if (!Number.isFinite(slope)) {
    const { x } = p1;
    return {
      getY: () => 0,
      getX: () => x,
    };
  }

  return {
    getY: (x: number) => slope * x + yIntercept,
    getX: (y: number) => (y - yIntercept) / slope,
  };
};

// can't use lodash clamp in worklet
const clamp = (num: number, min: number, max: number) => {
  'worklet';
  return num >= max ? max : num <= min ? min : num;
};

const degToRad = (deg: number) => (Math.PI * deg) / 180;

/* 
this code can be used to display the computed imgQuad for debugging purpose
First import svg : 
```
import Svg, { Path } from 'react-native-svg';
```
Then compute the path that represent the imgQuad
```
const path = useMemo(() => {
  if (componentSize && displayedImageSize) {
    const scale =
      mediaSizeInfos.width / mediaSizeInfos.height > aspectRatio
        ? componentSize.height / cropData.height
        : componentSize.width / cropData.width;
    const dx = componentSize.width - displayedImageSize.width;

    const { topLeft, topRight, bottomRight, bottomLeft } =
      mediaSizeInfos.imgQuad;

    let [tl, tr, br, bl] = [topLeft, topRight, bottomRight, bottomLeft]
      .map(({ x, y }) => ({
        x: x * scale + dx / 2 - cropData.originX * scale,
        y: y * scale - cropData.originY * scale,
      }))
      .map(({ x, y }) => ({ x: x + 100, y: y + 100 }));

    // little delta for clarity
    tl = { x: tl.x - 2, y: tl.y - 2 };
    tr = { x: tr.x + 2, y: tr.y - 2 };
    br = { x: br.x + 2, y: br.y + 2 };
    bl = { x: bl.x - 2, y: bl.y + 2 };

    const str = (p: Point) => `${p.x} ${p.y}`;

    return `M ${str(tl)} L ${str(tr)} L ${str(br)} L ${str(bl)} Z`;
  }
  return '';
}, [
  componentSize,
  displayedImageSize,
  mediaSizeInfos.width,
  mediaSizeInfos.height,
  mediaSizeInfos.imgQuad,
  aspectRatio,
  cropData.height,
  cropData.width,
  cropData.originX,
  cropData.originY,
]);
```

Then render the image inside of grid container : 
<AnimatedImage
  source={{ ...media, videoTime: startTime }}
  style={imageCropStyle}
  editionParameters={{
    orientation: parameters.orientation,
    roll: editionParameters?.roll,
    yaw: editionParameters?.yaw,
    pitch: editionParameters?.pitch,
  }}
/>

Render the path 
```

{componentSize && (
  <Svg
    style={{
      position: 'absolute',
      left: -100,
      top: -100,
      width: componentSize.width + 200,
      height: componentSize.height + 200,
    }}
  >
    <Path stroke={colors.blue} strokeWidth={1} d={path} />
  </Svg>
)}
```

Compare the bounds of the image and the path
*/
