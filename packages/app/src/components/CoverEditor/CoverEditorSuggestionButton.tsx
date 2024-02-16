import { Platform, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { GPUImageView, VideoFrame, Image as ImageLayer } from '#components/gpu';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAnimatedState from '#hooks/useAnimatedState';
import { FLOATING_BUTTON_SIZE } from '#ui/FloatingButton';
import FloatingIconButton from '#ui/FloatingIconButton';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import type { TemplateKind } from './coverEditorTypes';

type CoverEditorSuggestionButtonProps = {
  sourceMedia: { kind: 'image' | 'video'; uri: string } | null;
  mediaVisible: boolean;
  iconHeight?: number;
  templateKind: TemplateKind;
  hasSuggestedMedia: boolean;
  suggestedMediaLoaderBusy: boolean;
  toggleMediaVisibility: () => void;
  onNextSuggestedMedia: () => void;
};

const CoverEditorSuggestionButton = ({
  sourceMedia,
  templateKind,
  mediaVisible,
  hasSuggestedMedia,
  suggestedMediaLoaderBusy,
  toggleMediaVisibility,
  onNextSuggestedMedia,
}: CoverEditorSuggestionButtonProps) => {
  const timing = useAnimatedState(
    sourceMedia != null && !mediaVisible && hasSuggestedMedia,
    { preventInitialAnimation: true },
  );

  const suggestionAnimatedStyle = useAnimatedStyle(() => {
    return {
      top: interpolate(
        timing.value,
        [0, 1],
        [(FLOATING_BUTTON_SIZE + 10) / 2, 0],
      ),
      opacity: !sourceMedia ? 1 : interpolate(timing.value, [0, 1], [0, 1]),
    };
  });
  const mediaVisibleAnimatedStyle = useAnimatedStyle(() => {
    return {
      top: interpolate(
        timing.value,
        [0, 1],
        [(FLOATING_BUTTON_SIZE + 10) / 2, FLOATING_BUTTON_SIZE + 10],
      ),
    };
  });
  const styles = useStyleSheet(styleSheet);

  if (!sourceMedia && !hasSuggestedMedia) {
    return null;
  }

  return (
    <View
      style={{
        width: FLOATING_BUTTON_SIZE,
        height: FLOATING_BUTTON_SIZE * 2 + 10,
      }}
    >
      <Animated.View
        style={[{ position: 'absolute' }, suggestionAnimatedStyle]}
      >
        <FloatingIconButton
          icon={
            templateKind === 'video' ? 'suggested_video' : 'suggested_photo'
          }
          iconSize={30}
          onPress={onNextSuggestedMedia}
          loading={suggestedMediaLoaderBusy}
        />
      </Animated.View>
      <Animated.View
        style={[{ position: 'absolute' }, mediaVisibleAnimatedStyle]}
      >
        {sourceMedia &&
          (Platform.OS === 'ios' ? (
            <PressableOpacity
              style={[styles.mediaHideButton]}
              onPress={toggleMediaVisibility}
            >
              <GPUImageView
                style={[
                  styles.mediaHideButtonImage,
                  !mediaVisible && { opacity: 0.5 },
                ]}
                testID="image-picker-media-video"
              >
                {sourceMedia.kind === 'image' ? (
                  <ImageLayer uri={sourceMedia.uri} />
                ) : (
                  <VideoFrame uri={sourceMedia.uri} time={0} />
                )}
              </GPUImageView>

              <Icon
                style={styles.mediaHideButtonIcon}
                icon={mediaVisible ? 'preview' : 'hide'}
              />
            </PressableOpacity>
          ) : (
            <FloatingIconButton
              icon={mediaVisible ? 'preview' : 'hide'}
              onPress={toggleMediaVisibility}
            />
          ))}
      </Animated.View>
    </View>
  );
};

export default CoverEditorSuggestionButton;

const styleSheet = createStyleSheet(appearance => ({
  mediaHideButton: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    borderColor: appearance === 'light' ? colors.black : colors.white,
    borderWidth: 1,
    borderStyle: 'solid',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mediaHideButtonImage: {
    width: FLOATING_BUTTON_SIZE - 6,
    height: FLOATING_BUTTON_SIZE - 6,
    borderRadius: (FLOATING_BUTTON_SIZE - 4) / 2,
    overflow: 'hidden',
  },
  mediaHideButtonIcon: {
    position: 'absolute',
    margin: 'auto',
    width: 24,
    height: 24,
  },
}));
