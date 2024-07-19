import clamp from 'lodash/clamp';
import isEqual from 'lodash/isEqual';
import range from 'lodash/range';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { colors, mixins } from '#theme';
import { cropDataForAspectRatio } from '#helpers/mediaEditions';
import type { CropData, ImageOrientation } from '#helpers/mediaEditions';
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

    const height = orientationInvertSize ? mediaSize.width : mediaSize.height;
    const width = orientationInvertSize ? mediaSize.height : mediaSize.width;

    return {
      width,
      height,
    };
  }, [mediaSize.height, mediaSize.width, orientation]);

  const cropLimits = useMemo(
    () =>
      calculateRotatedImageLimits(
        mediaSizeInfos.width,
        mediaSizeInfos.height,
        roll ?? 0,
      ),
    [mediaSizeInfos.height, mediaSizeInfos.width, roll],
  );

  const cropData = useMemo(
    () =>
      getValidCropData(
        cropDataProps,
        aspectRatio,
        mediaSizeInfos.width,
        mediaSizeInfos.height,
        cropLimits,
      ),
    [
      cropDataProps,
      aspectRatio,
      mediaSizeInfos.width,
      mediaSizeInfos.height,
      cropLimits,
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
    const cropDataCurrentValid = getValidCropData(
      cropDataCurrentValue,
      aspectRatio,
      mediaSizeInfos.width,
      mediaSizeInfos.height,
      cropLimits,
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
    cropLimits,
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

          setCropDataCurrentValue(cropDataCurrentValue => ({
            ...cropDataCurrentValue,
            originX: clamp(
              offsetX - e.translationX / scale,
              cropLimits.left,
              cropLimits.right - offsetWidth,
            ),
            originY: clamp(
              offsetY - e.translationY / scale,
              cropLimits.top,
              cropLimits.bottom - offsetHeight,
            ),
          }));
        })
        .onFinalize(onGestureEnd),
    [
      aspectRatio,
      cropLimits,
      displayedHeight,
      displayedWidth,
      mediaHeight,
      mediaWidth,
      onGestureEnd,
      onGestureStart,
    ],
  );

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

          const scale =
            mediaWidth / mediaHeight > aspectRatio
              ? displayedHeight / offsetHeight
              : displayedWidth / offsetWidth;

          const centerX = offsetX + e.focalX / scale;
          const centerY = offsetY + e.focalY / scale;
          const newWidth = offsetWidth / e.scale;
          const newHeight = offsetHeight / e.scale;

          const cropData = {
            originX: centerX - newWidth / 2,
            originY: centerY - newHeight / 2,
            width: newWidth,
            height: newHeight,
          };

          setCropDataCurrentValue(
            getValidCropData(
              cropData,
              aspectRatio,
              mediaWidth,
              mediaHeight,
              cropLimits,
            ),
          );
        })
        .onFinalize(onGestureEnd),
    [
      onGestureStart,
      onGestureEnd,
      displayedWidth,
      displayedHeight,
      aspectRatio,
      mediaWidth,
      mediaHeight,
      cropLimits,
    ],
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

type RectLimit = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const getValidCropData = (
  cropData: CropData | null | undefined,
  aspectRatio: number,
  mediaWidth: number,
  mediaHeight: number,
  rectLimit: RectLimit,
) => {
  if (
    !cropData ||
    cropData.width > mediaWidth ||
    cropData.height > mediaHeight ||
    // might have slight error due to javascript floating number
    Math.abs(cropData.width / cropData.height - aspectRatio) > 0.00001
  ) {
    cropData = cropDataForAspectRatio(mediaWidth, mediaHeight, aspectRatio);
  }

  return applyLimits(cropData, rectLimit);
};

const applyLimits = (
  cropData: CropData,
  limits: RectLimit,
  reduceSize = false,
): CropData => {
  const aspectRatio = cropData.width / cropData.height;
  if (cropData.originX < limits.left) {
    cropData = { ...cropData, originX: limits.left };
  }
  if (cropData.originY < limits.top) {
    cropData = { ...cropData, originY: limits.top };
  }
  if (cropData.originX + cropData.width > limits.right) {
    if (reduceSize) {
      const width = limits.right - cropData.originX;
      cropData = {
        ...cropData,
        width,
        height: width / aspectRatio,
      };
    } else {
      cropData = { ...cropData, originX: limits.right - cropData.width };
    }
  }
  if (cropData.originY + cropData.height > limits.bottom) {
    if (reduceSize) {
      const height = limits.bottom - cropData.originY;
      cropData = {
        ...cropData,
        height,
        width: height * aspectRatio,
      };
    } else {
      cropData = { ...cropData, originY: limits.bottom - cropData.height };
    }
  }
  if (reduceSize) {
    return cropData;
  } else {
    return applyLimits(cropData, limits, true);
  }
};

const calculateRotatedImageLimits = (
  mediaWidth: number,
  mediaHeight: number,
  roll: number,
) => {
  const center = { x: mediaWidth / 2, y: mediaHeight / 2 };
  const rect = createRect(0, 0, mediaWidth, mediaHeight);
  typedEntries(rect).forEach(([key, point]) => {
    const rotatedPoint = translateCenter(point, center, roll);
    rect[key] = rotatedPoint;
  });

  const maxLeft = Math.max(rect.topLeft.x, rect.bottomLeft.x);
  const minRight = Math.min(rect.topRight.x, rect.bottomRight.x);
  const maxTop = Math.max(rect.topLeft.y, rect.topRight.y);
  const minBottom = Math.min(rect.bottomLeft.y, rect.bottomRight.y);
  return {
    left: maxLeft,
    right: minRight,
    top: maxTop,
    bottom: minBottom,
  };
};

const degToRad = (deg: number) => (Math.PI * deg) / 180;

type Point = { x: number; y: number };

const createRect = (x: number, y: number, width: number, height: number) => ({
  topLeft: { x, y },
  topRight: { x: x + width, y },
  bottomLeft: { x, y: y + height },
  bottomRight: { x: x + width, y: y + height },
});

const translatePoint = ({ x, y }: Point, tx: number, ty: number) => ({
  x: x + tx,
  y: y + ty,
});

const rotatePoint = ({ x, y }: Point, angle: number) => {
  const theta = degToRad(angle);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  return {
    x: cosTheta * x - sinTheta * y,
    y: sinTheta * x + cosTheta * y,
  };
};

const translateCenter = (point: Point, center: Point, angle: number) =>
  translatePoint(
    rotatePoint(translatePoint(point, -center.x, -center.y), angle),
    center.x,
    center.y,
  );
