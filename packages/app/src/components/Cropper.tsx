import clamp from 'lodash/clamp';
import isEqual from 'lodash/isEqual';
import range from 'lodash/range';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { colors, mixins } from '#theme';
import type { CropData, ImageOrientation } from '#components/gpu';
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  ViewProps,
} from 'react-native';

export type CropperProps = Omit<ViewProps, 'children'> & {
  /**
   * the size of the media to crop
   */
  mediaSize: { width: number; height: number };
  /**
   * the desired aspect ratio of the cropped media
   */
  aspectRatio: number;
  /**
   * the cropData applied to the media
   */
  cropData?: CropData | null;
  /**
   * the orientation of the media
   */
  orientation?: ImageOrientation | null;
  /**
   * the roll parameter of applied to the media
   */
  roll?: number | null;
  /**
   * the pitch parameter of applied to the media
   */
  pitch?: number | null;
  /**
   * the yaw parameter of applied to the media
   */
  yaw?: number | null;
  /**
   * if true, the component will be in crop mode
   */
  cropEditionMode?: boolean | null;
  /**
   * if false, the component will not display the outer line of the crop grid
   * @default true
   */
  displayOuterLines?: boolean | null;
  /**
   * A callback that will be called when the crop data change
   * @param cropData the new crop data
   */
  onCropDataChange?: (cropData: CropData) => void;
  /**
   * Render prop that will be called with an animated crop data value
   */
  children: (cropData: CropData) => React.ReactNode;
};

/**
 * Component with a render prop that will be called with an animated crop data value
 * that can be used to crop an image or a video.
 */
const Cropper = ({
  mediaSize,
  aspectRatio,
  cropData: cropDataProps,
  orientation,
  roll,
  pitch,
  yaw,
  cropEditionMode,
  displayOuterLines = true,
  onCropDataChange,
  onLayout: onLayoutProps,
  children,
  style,
  ...props
}: CropperProps) => {
  const [componentSize, setComponentSize] = useState<LayoutRectangle | null>(
    null,
  );

  const onLayout = (e: LayoutChangeEvent) => {
    onLayoutProps?.(e);
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
      orientation === 'LEFT' || orientation === 'RIGHT';

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
    if (pitch) {
      const pitchDeg = degToRad(pitch);
      const sinY = Math.sin(pitchDeg);
      const cosY = Math.cos(pitchDeg);

      Object.values(imgQuad).forEach(point => {
        const { y, z = 0 } = point;
        point.y = (y - cx) * cosY - (z - cz) * sinY + cx;
        point.z = (y - cx) * sinY + (z - cz) * cosY + cz;
      });
    }
    if (yaw) {
      const yawDeg = degToRad(yaw);
      const sinY = Math.sin(-yawDeg);
      const cosY = Math.cos(-yawDeg);

      Object.values(imgQuad).forEach(point => {
        const { x, z = 0 } = point;
        point.x = (x - cx) * cosY - (z - cz) * sinY + cx;
        point.z = (x - cx) * sinY + (z - cz) * cosY + cz;
      });
    }
    if (roll) {
      const rollDeg = degToRad(roll);
      const sinR = Math.sin(-rollDeg);
      const cosR = Math.cos(-rollDeg);

      Object.values(imgQuad).forEach(point => {
        const { x, y } = point;
        point.x = (x - cx) * cosR - (y - cy) * sinR + cx;
        point.y = (x - cx) * sinR + (y - cy) * cosR + cy;
      });
    }

    if (roll || pitch || yaw) {
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
  }, [mediaSize.height, mediaSize.width, orientation, pitch, roll, yaw]);

  const cropData = useMemo(
    () =>
      getValidCropdata(
        cropDataProps,
        aspectRatio,
        mediaSizeInfos.width,
        mediaSizeInfos.height,
        mediaSizeInfos.imgQuad,
      ),
    [
      cropDataProps,
      aspectRatio,
      mediaSizeInfos.width,
      mediaSizeInfos.height,
      mediaSizeInfos.imgQuad,
    ],
  );

  useEffect(() => {
    if (!isEqual(cropData, cropDataProps) && onCropDataChange) {
      onCropDataChange(cropData);
    }
  }, [cropData, cropDataProps, onCropDataChange]);

  const [cropDataCurrentValue, setCropDataCurrentValue] = useState(cropData);

  useEffect(() => {
    setCropDataCurrentValue(cropData);
  }, [cropData]);

  const mediaWidth = mediaSizeInfos.width;
  const mediaHeight = mediaSizeInfos.height;
  const displayedWidth = displayedImageSize?.width ?? 0;
  const displayedHeight = displayedImageSize?.height ?? 0;

  const gestureContext = useRef(cropDataCurrentValue);

  const onGestureStart = useCallback(() => {
    gestureContext.current = cropDataCurrentValue;
  }, [cropDataCurrentValue]);

  const onGestureEnd = useCallback(() => {
    const cropDataCurrentValid = getValidCropdata(
      cropDataCurrentValue,
      aspectRatio,
      mediaSizeInfos.width,
      mediaSizeInfos.height,
      mediaSizeInfos.imgQuad,
    );

    if (!isEqual(cropData, cropDataCurrentValid)) {
      //We need to send the parameters to the parent callback
      if (onCropDataChange) {
        onCropDataChange(cropDataCurrentValid);
      }
      // TODO crop animation
      setCropDataCurrentValue(cropDataCurrentValid);
    }

    return cropDataCurrentValue;
  }, [
    cropDataCurrentValue,
    aspectRatio,
    mediaSizeInfos.width,
    mediaSizeInfos.height,
    mediaSizeInfos.imgQuad,
    cropData,
    onCropDataChange,
  ]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .maxPointers(1)
        .onStart(onGestureStart)
        .onChange(e => {
          const {
            originX: offsetX,
            originY: offsetY,
            width: offsetWidth,
            height: offsetHeight,
          } = gestureContext.current;

          const scale =
            mediaWidth / mediaHeight > aspectRatio
              ? displayedHeight / offsetHeight
              : displayedWidth / offsetWidth;

          // TODO reenable this when we make sure that cropping outside of the image is not an issue on the native side
          // setCropDataCurrentValue(cropDataCurrentValue => ({
          //   ...cropDataCurrentValue,
          //   originX: clamp(
          //     offsetX - e.translationX / scale,
          //     -offsetWidth / 4,
          //     mediaWidth - (3 * offsetWidth) / 4,
          //   ),
          //   originY: clamp(
          //     offsetY + e.translationY / scale,
          //     -offsetHeight / 2,
          //     mediaHeight - (3 * offsetHeight) / 4,
          //   ),
          // }));

          setCropDataCurrentValue(cropDataCurrentValue => ({
            ...cropDataCurrentValue,
            originX: clamp(
              offsetX - e.translationX / scale,
              0,
              mediaWidth - offsetWidth,
            ),
            originY: clamp(
              offsetY + e.translationY / scale,
              0,
              mediaHeight - offsetHeight,
            ),
          }));
        })
        .onFinalize(onGestureEnd),
    [
      aspectRatio,
      displayedHeight,
      displayedWidth,
      mediaHeight,
      mediaWidth,
      onGestureEnd,
      onGestureStart,
    ],
  );

  const isAndroid = Platform.OS === 'android';
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart(onGestureStart)
        .onChange(e => {
          const {
            originX: offsetX,
            originY: offsetY,
            width: offsetWidth,
            height: offsetHeight,
          } = gestureContext.current;

          let width = offsetWidth / e.scale;
          let height = offsetHeight / e.scale;
          if (isAndroid) {
            // android effect doesn't support this kind of downscaling
            width = Math.min(width, mediaWidth);
            height = Math.min(height, mediaHeight);
          }

          setCropDataCurrentValue({
            originX: offsetX - (width - offsetWidth) / 2,
            originY: offsetY - (height - offsetHeight) / 2,
            width,
            height,
          });
        })
        .onFinalize(onGestureEnd),
    [isAndroid, mediaHeight, mediaWidth, onGestureEnd, onGestureStart],
  );

  return (
    <View onLayout={onLayout} style={[style, styles.container]} {...props}>
      {children(cropDataCurrentValue)}
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
                <View
                  key={index}
                  style={[
                    styles.verticalLine,
                    {
                      opacity: displayOuterLines || index % 3 !== 0 ? 1 : 0,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={[styles.horizontalGrid, displayedImageSize]}>
              {range(0, 4).map(index => (
                <View
                  key={index}
                  style={[
                    styles.horizontalLine,
                    {
                      opacity: displayOuterLines || index % 3 !== 0 ? 1 : 0,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </GestureDetector>
      )}
    </View>
  );
};

export default Cropper;

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
    backgroundColor: colors.grey800,
  },
  horizontalGrid: {
    ...mixins.absoluteFill,
    justifyContent: 'space-between',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: colors.grey800,
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
