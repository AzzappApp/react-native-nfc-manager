import {
  clamp,
  type SkRect,
  type SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import { useCallback, useMemo, useRef } from 'react';
import {
  Dimensions,
  PixelRatio,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_CARD_RADIUS,
  COVER_MAX_MEDIA_DURATION,
} from '@azzapp/shared/coverHelpers';
import { shadow } from '#theme';
import VideoCompositionRenderer from '#components/VideoCompositionRenderer';
import { reduceVideoResolutionIfNecessary } from '#helpers/mediaEditions';
import ActivityIndicator from '#ui/ActivityIndicator';
import { SocialIcon } from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import coverDrawer, { coverTransitions } from './coverDrawer';
import { createParagraph } from './coverDrawer/coverTextDrawer';
import { useCoverEditorContext } from './CoverEditorContext';
import { mediaInfoIsImage } from './coverEditorHelpers';
import CoverLayerBoundsEditor from './CoverLayerBoundsEditor';
import type { ResizeAxis } from './CoverLayerBoundsEditor/coverBoundsLayerEditorTypes';
import type {
  FrameDrawer,
  VideoCompositionItem,
} from '@azzapp/react-native-skia-video';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type {
  ColorValue,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CoverPreviewProps = Exclude<ViewProps, 'children'> & {
  /**
   * Font manager used to load the fonts used in the cover
   */
  fontManager: SkTypefaceFontProvider;
  /**
   * Width of the cover preview
   */
  width: number;
  /**
   * Height of the cover preview
   */
  height: number;
  /**
   * Color tryptic of the card
   */
  cardColors: Readonly<ColorPalette> | null;
  /**
   * A callback to update the translation of the preview when the keyboard is displayed
   * this function must be a worklet
   *
   * @param translateY The translation to apply to the preview
   */
  onKeyboardTranslateWorklet: (translateY: number) => void;
};

/**
 * Cover preview component
 * This component is used to display the cover in edition
 */
const CoverPreview = ({
  width,
  height,
  style,
  fontManager,
  cardColors,
  onKeyboardTranslateWorklet,
  ...props
}: CoverPreviewProps) => {
  // #region Data and state
  const { dispatch, coverEditorState } = useCoverEditorContext();
  const {
    coverTransition,
    medias,
    overlayLayer,
    textLayers,
    linksLayer,
    backgroundColor,

    images,
    videoPaths,
    lutShaders,
    loadingLocalMedia,
    loadingRemoteMedia,

    layerMode,
    selectedLayerIndex,
  } = coverEditorState;

  /**
   * Whether the cover is dynamic (i.e. contains animations or multiple media items)
   * Non dynamic covers can be rendered as a single image, while dynamic covers require
   * a video composition.
   */
  const isDynamic =
    medias.some(
      mediaInfo => !mediaInfoIsImage(mediaInfo) || mediaInfo.animation != null,
    ) || medias.length > 1;

  /**
   * Dependencies for the composition displayed in the preview
   * We need to limit as much as possible the recomputation of the composition
   * to avoid unnecessary re-renders of the preview (and recreation of the video decoder)
   */
  const compositionDependencies = [
    coverTransition,
    images,
    loadingLocalMedia,
    loadingRemoteMedia,
    isDynamic,
    medias
      .map(mediaInfo =>
        mediaInfoIsImage(mediaInfo)
          ? `${mediaInfo.media.uri}-${mediaInfo.duration}`
          : `${mediaInfo.media.uri}-${mediaInfo.timeRange.startTime}-${mediaInfo.timeRange.duration}`,
      )
      .join(''),
    overlayLayer?.media.uri,
    videoPaths,
  ];

  /**
   * Video composition to display in the preview
   * The video scale is the result of the reduction of the video resolution
   * in the video decoder to avoid decoding videos at full resolution
   */
  const { composition, videoScales } = useMemo(() => {
    const allItemsLoaded =
      medias.every(
        ({ media }) =>
          (media.kind === 'image' && images[media.uri]) ||
          (media.kind === 'video' && videoPaths[media.uri]),
      ) &&
      (!overlayLayer?.media.uri || images[overlayLayer.media.uri]);
    if (loadingLocalMedia || loadingRemoteMedia || !allItemsLoaded) {
      return { composition: null, videoScales: {} };
    }
    if (!isDynamic) {
      // a fake composition with a duration of 5 seconds to display a static image
      return { composition: { duration: 5, items: [] }, videoScales: {} };
    }
    let duration = 0;
    const videoScales: Record<string, number> = {};
    const items: VideoCompositionItem[] = [];
    const transitionDuration =
      coverTransitions[coverTransition ?? 'none']?.duration ?? 0;
    for (const { media } of medias) {
      duration = Math.max(0, duration - transitionDuration);
      if (media.kind === 'image') {
        duration += COVER_MAX_MEDIA_DURATION;
      } else if (media.kind === 'video') {
        const path = videoPaths[media.uri];
        const itemDuration = Math.min(media.duration, COVER_MAX_MEDIA_DURATION);
        const { resolution, videoScale } = reduceVideoResolutionIfNecessary(
          media.width,
          media.height,
          media.rotation,
          MAX_DISPLAY_DECODER_RESOLUTION,
        );
        videoScales[media.uri] = videoScale;
        items.push({
          id: media.uri,
          path,
          startTime: 0,
          compositionStartTime: duration,
          duration: itemDuration,
          resolution,
        });
        duration += itemDuration;
      }
    }

    return {
      composition: {
        duration,
        items,
      },
      videoScales,
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, compositionDependencies);

  /**
   * Shared values to override bounds and rotation of the layer currently being edited
   * This allows to display in real-time the changes made by the user, without updating the state
   * too often.
   */
  const boundsOverridesSharedValue = useSharedValue<{
    bounds: SkRect;
    rotation: number;
  } | null>(null);
  /**
   * Shared value to override the font size of the text layer currently being edited
   * This allows to display in real-time the changes made by the user when scaling the text layer
   * without updating the state too often.
   */
  const fontSizeOverrideSharedValue = useSharedValue<number | null>(null);
  // #endregion

  // #region Frame drawing
  /**
   * The main function used to draw the frame of the cover in the preview
   */
  const drawFrame = useCallback<FrameDrawer>(
    infos => {
      'worklet';
      if (!lutShaders) {
        return;
      }
      let state = coverEditorState;
      if (boundsOverridesSharedValue.value) {
        const { bounds, rotation } = boundsOverridesSharedValue.value;
        if (state.layerMode === 'overlay' && state.overlayLayer) {
          state = {
            ...state,
            overlayLayer: {
              ...state.overlayLayer,
              bounds,
              rotation,
            },
          };
        }
        if (
          state.layerMode === 'text' ||
          (state.layerMode === 'textEdit' && state.selectedLayerIndex != null)
        ) {
          state = {
            ...state,
            textLayers: state.textLayers.map((textLayer, i) => {
              if (i === state.selectedLayerIndex) {
                return {
                  ...textLayer,
                  width: bounds.width,
                  position: {
                    x: bounds.x,
                    y: bounds.y,
                  },
                  style: {
                    ...textLayer.style,
                    fontSize:
                      fontSizeOverrideSharedValue.value ??
                      textLayer.style.fontSize,
                  },
                  rotation,
                };
              }
              return textLayer;
            }),
          };
        }
      }
      if (layerMode === 'textEdit') {
        state = {
          ...state,
          textLayers: state.textLayers.filter(
            (_, i) => i !== selectedLayerIndex,
          ),
        };
      }
      coverDrawer({
        ...infos,
        coverEditorState: state,
        images,
        lutShaders,
        videoScales,
        fontManager,
        cardColors,
      });
    },
    [
      lutShaders,
      coverEditorState,
      boundsOverridesSharedValue,
      layerMode,
      images,
      videoScales,
      fontManager,
      cardColors,
      fontSizeOverrideSharedValue,
      selectedLayerIndex,
    ],
  );
  // #endregion

  // #region Layer selection and edition
  /**
   * Callback to handle the tap on the overlay layer
   * This will select the overlay layer for edition
   */
  const handleOverlayLayerTap = useCallback(() => {
    dispatch({
      type: 'SELECT_LAYER',
      payload: { layerMode: 'overlay', index: null },
    });
  }, [dispatch]);

  /**
   * Callback to handle the tap on a text layer
   * This will select the text layer for edition
   */
  const handleTextLayerTap = useCallback(
    (index: number) => {
      dispatch({
        type: 'SELECT_LAYER',
        payload: { layerMode: 'text', index },
      });
    },
    [dispatch],
  );

  /**
   * Callback to handle the press on the links layer
   * This will select the links layer for edition
   */
  const handleLinksPress = useCallback(() => {
    dispatch({
      type: 'SELECT_LAYER',
      payload: {
        index: null,
        layerMode: 'links',
      },
    });
  }, [dispatch]);

  /**
   * Callback to handle the press outside a layer
   * This will unselect the current layer
   */
  const handlePressOutsideLayer = useCallback(() => {
    dispatch({
      type: 'SELECT_LAYER',
      payload: { layerMode: null, index: null },
    });
  }, [dispatch]);

  /**
   * Callback to delete the layer currently being edited
   */
  const handleDeleteCurrentLayer = useCallback(() => {
    dispatch({ type: 'DELETE_CURRENT_LAYER' });
  }, [dispatch]);
  // #endregion

  // #region Layer edition gestures handling
  /**
   * Callback to update the bounds and rotation overrides of the layer currently being edited
   * This will update the shared values used to display the changes in real-time
   */
  const onUpdateProgressWorklet = useCallback(
    (bounds: SkRect, rotation: number) => {
      'worklet';
      boundsOverridesSharedValue.value = {
        bounds,
        rotation,
      };
    },
    [boundsOverridesSharedValue],
  );

  /**
   * Callback to update the bounds and rotation of the layer currently being edited in the state
   * This will update the state with the final changes made by the user
   */
  const onUpdateEnd = useCallback(
    (bounds: SkRect, rotation: number) => {
      if (layerMode === 'overlay') {
        dispatch({
          type: 'UPDATE_OVERLAY_BOUNDS',
          payload: {
            bounds,
            rotation,
          },
        });
      } else if (
        (layerMode === 'text' || layerMode === 'textEdit') &&
        selectedLayerIndex != null
      ) {
        const fontSize =
          fontSizeOverrideSharedValue.value ??
          textLayers[selectedLayerIndex].style.fontSize;
        dispatch({
          type: 'UPDATE_TEXT_SIZE',
          payload: {
            index: selectedLayerIndex,
            position: {
              x: bounds.x,
              y: bounds.y,
            },
            width: bounds.width,
            fontSize,
            rotation,
          },
        });
      }
      setTimeout(() => {
        boundsOverridesSharedValue.value = null;
        fontSizeOverrideSharedValue.value = null;
      }, 10);
    },
    [
      boundsOverridesSharedValue,
      dispatch,
      fontSizeOverrideSharedValue,
      layerMode,
      selectedLayerIndex,
      textLayers,
    ],
  );

  /**
   * Callback to transform the bounds of the text layer after a resize
   * This will update the height of the text layer to match the layout of the text
   * computed with th Skia paragraph API
   */
  const transformBoundsAfterResizeWorklet = useCallback(
    (bounds: SkRect) => {
      'worklet';
      if (selectedLayerIndex != null) {
        const { x, y, width: layerWidth } = bounds;
        const paragraph = createParagraph(
          { ...textLayers[selectedLayerIndex], width: layerWidth },
          fontManager,
          width,
        );
        return {
          x,
          y,
          width: layerWidth,
          height: paragraph.getHeight() / height,
        };
      }
      return bounds;
    },
    [fontManager, height, selectedLayerIndex, textLayers, width],
  );

  /**
   * Callback to compute the bounds of the text layer after a scale
   * This will update the width and the font size of the text layer
   * based on the scale applied by the user
   */
  const computeTextScaleWorklet = useCallback(
    (offsetBounds: SkRect, scale: number) => {
      'worklet';
      if (selectedLayerIndex == null) {
        return null;
      }
      const { x, y, width: offsetWidth, height: offsetHeight } = offsetBounds;
      const layer = textLayers[selectedLayerIndex];

      const layerWidth = clamp(offsetWidth * scale, 0.2, 1);
      const fontSize = clamp(layer.style.fontSize * scale, 10, 48);
      fontSizeOverrideSharedValue.value = fontSize;
      const paragraph = createParagraph(
        {
          ...layer,
          style: {
            ...layer.style,
            fontSize,
          },
          width: layerWidth,
        },
        fontManager,
        width,
      );
      const layerHeight = paragraph.getHeight() / height;
      return {
        x: x - (layerWidth - offsetWidth) / 2,
        y: y - (layerHeight - offsetHeight) / 2,
        width: layerWidth,
        height: layerHeight,
      };
    },
    [
      fontManager,
      fontSizeOverrideSharedValue,
      height,
      selectedLayerIndex,
      textLayers,
      width,
    ],
  );
  // #endregion

  // #region Text edition
  const inputRef = useRef<TextInput | null>(null);
  /**
   * Callback to handle the edition of a text layer
   * This will select the text layer for edition and focus the text input
   */
  const handeTextLayerEdit = useCallback(() => {
    if (selectedLayerIndex == null) {
      return;
    }
    dispatch({
      type: 'SELECT_LAYER',
      payload: { layerMode: 'textEdit', index: selectedLayerIndex },
    });
    const length = textLayers[selectedLayerIndex].text?.length ?? 0;
    // Since the TextInput is not displayed yet, we need to wait a bit before focusing it
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelection(0, length);
    }, 10);
  }, [dispatch, selectedLayerIndex, textLayers]);

  const handleChangeText = useCallback(
    (text: string) => {
      if (selectedLayerIndex != null) {
        dispatch({
          type: 'UPDATE_TEXT',
          payload: { index: selectedLayerIndex, text },
        });
      }
    },
    [dispatch, selectedLayerIndex],
  );

  const textLayersWidthBounds = useMemo(() => {
    return textLayers.map(textLayer => {
      const paragraph = createParagraph(textLayer, fontManager, width);
      return {
        textLayer,
        bounds: {
          ...textLayer.position,
          width: textLayer.width,
          height: paragraph.getHeight() / height,
        },
      };
    });
  }, [fontManager, height, textLayers, width]);

  /**
   * The text layer currently being edited
   */
  const editedTextLayer =
    layerMode === 'textEdit' && selectedLayerIndex != null
      ? textLayers[selectedLayerIndex] ?? null
      : null;

  /**
   * Animated style for the text input
   * This will update the position and the size of the text input based on the bounds of the text layer
   * currently being edited
   */
  const animatedTextInputStyle = useAnimatedStyle(() => {
    if (boundsOverridesSharedValue.value) {
      const { bounds, rotation } = boundsOverridesSharedValue.value;
      return {
        top: bounds.y * height,
        left: bounds.x * width,
        width: bounds.width * width,
        transform: [{ rotate: `${rotation}rad` }],
      };
    }
    if (editedTextLayer) {
      return {
        top: editedTextLayer.position.y * height,
        left: editedTextLayer.position.x * width,
        width: editedTextLayer.width * width,
        transform: [{ rotate: `${editedTextLayer.rotation}rad` }],
      };
    }
    return { top: 0, left: 0 };
  });
  // #endregion

  // #region Keyboard handling

  //##############################################################################
  //#
  //# This whole section is used to compute the translation of the
  //# preview when the keyboard is displayed  to place the text input
  //# in the center of the remaining space of the screen
  //#
  //##############################################################################

  const {
    height: keyboardHeightSharedValue,
    progress: keyboardProgressSharedValue,
  } = useReanimatedKeyboardAnimation();
  const { height: windowHeight } = useWindowDimensions();
  const pageYSharedValue = useSharedValue(0);
  const inputSize = useSharedValue<LayoutRectangle | null>(null);

  const containerRef = useCallback(
    (ref: View | null) => {
      ref?.measureInWindow((_, y) => {
        pageYSharedValue.value = y;
      });
    },
    [pageYSharedValue],
  );

  const handeTextInputLayout = useCallback(
    (event: LayoutChangeEvent) => {
      inputSize.value = event.nativeEvent.layout;
    },
    [inputSize],
  );
  useAnimatedReaction(
    () =>
      [
        inputSize.value,
        pageYSharedValue.value,
        keyboardProgressSharedValue.value,
        keyboardHeightSharedValue.value,
      ] as const,
    ([inputSize, pageY, keyboardProgress, keyboardHeight]) => {
      if (!inputSize) {
        onKeyboardTranslateWorklet(0);
        return;
      }
      const { y, height } = inputSize;
      const editionInputCenter = pageY + y + height / 2;
      return onKeyboardTranslateWorklet(
        interpolate(
          keyboardProgress,
          [0, 1],
          [0, keyboardHeight + windowHeight / 2 - editionInputCenter],
        ),
      );
    },
  );
  // #endregion

  return (
    <View
      style={[
        style,
        {
          width,
          height,
          backgroundColor:
            (swapColor(backgroundColor, cardColors) as ColorValue) ?? '#fff',
          borderRadius: COVER_CARD_RADIUS * width,
        },
        shadow('light'),
      ]}
    >
      <View
        ref={containerRef}
        style={[
          style,
          {
            borderRadius: COVER_CARD_RADIUS * width,
            width,
            height,
            overflow: 'hidden',
          },
        ]}
        {...props}
      >
        {loadingRemoteMedia ? (
          <ActivityIndicator />
        ) : (
          <View style={{ width, height }}>
            <VideoCompositionRenderer
              composition={composition}
              width={width}
              height={height}
              drawFrame={drawFrame}
            />
            <Pressable
              style={{ width, height, position: 'absolute' }}
              onPress={handlePressOutsideLayer}
            >
              {overlayLayer && (
                <CoverLayerBoundsEditor
                  active={layerMode === 'overlay'}
                  bounds={overlayLayer.bounds}
                  rotation={overlayLayer.rotation}
                  resizeAxis={OVERLAY_RESIZE_AXIS}
                  canvasSize={{ width, height }}
                  controlsPosition="top"
                  onTap={handleOverlayLayerTap}
                  onUpdateProgressWorklet={onUpdateProgressWorklet}
                  onUpdateEnd={onUpdateEnd}
                  onCrop={() => {}}
                  onDelete={handleDeleteCurrentLayer}
                />
              )}
              {textLayersWidthBounds.map(({ textLayer, bounds }, index) => (
                <CoverLayerBoundsEditor
                  key={index}
                  active={
                    (layerMode === 'text' || layerMode === 'textEdit') &&
                    selectedLayerIndex === index
                  }
                  bounds={bounds}
                  rotation={textLayer.rotation}
                  resizeAxis={TEXT_RESIZE_AXIS}
                  controlsPosition="right"
                  canvasSize={{ width, height }}
                  transformBoundsAfterResizeWorklet={
                    transformBoundsAfterResizeWorklet
                  }
                  overrideScaleUpdateWorklet={computeTextScaleWorklet}
                  onTap={() => {
                    handleTextLayerTap(index);
                  }}
                  onUpdateProgressWorklet={onUpdateProgressWorklet}
                  onUpdateEnd={onUpdateEnd}
                  onDelete={handleDeleteCurrentLayer}
                  onEdit={handeTextLayerEdit}
                  hideControls={layerMode === 'textEdit'}
                />
              ))}

              <PressableNative
                style={{
                  width: '100%',
                  height: 100,
                  flexDirection: 'row',
                  position: 'absolute',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bottom: 0,
                }}
                onPress={handleLinksPress}
                pointerEvents="box-none"
              >
                {linksLayer.links.map(link => (
                  <SocialIcon
                    style={{
                      height: linksLayer.style.size,
                      width: linksLayer.style.size,
                      tintColor: swapColor(linksLayer.style.color, cardColors),
                    }}
                    key={link.socialId}
                    icon={link.socialId as SocialLinkId}
                  />
                ))}
              </PressableNative>

              {editedTextLayer && (
                <AnimatedTextInput
                  ref={inputRef}
                  onLayout={handeTextInputLayout}
                  value={editedTextLayer.text ?? ''}
                  multiline
                  style={[
                    {
                      position: 'absolute',
                      fontFamily: editedTextLayer.style.fontFamily,
                      color: editedTextLayer.style.color ?? '#000',
                      fontSize: editedTextLayer.style.fontSize * (width / 300),
                      transformOrigin: 'center',
                      transform: [{ rotate: `${editedTextLayer.rotation}rad` }],
                      textAlign: editedTextLayer.style.textAlign,
                      padding: 0,
                      top: editedTextLayer.position.y * height,
                      left: editedTextLayer.position.x * width,
                      width: editedTextLayer.width * width,
                    },
                    animatedTextInputStyle,
                  ]}
                  onChangeText={handleChangeText}
                  scrollEnabled={false}
                />
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

export default CoverPreview;

const MAX_DISPLAY_DECODER_RESOLUTION = Math.min(
  (Dimensions.get('window').height / 2) * PixelRatio.get(),
  1920,
);
const OVERLAY_RESIZE_AXIS: ResizeAxis[] = ['x', 'y'];
const TEXT_RESIZE_AXIS: ResizeAxis[] = ['x'];

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
