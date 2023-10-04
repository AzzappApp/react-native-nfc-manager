import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { GPUImageView, VideoFrame, Image as ImageLayer } from '#components/gpu';
import useAnimatedState from '#hooks/useAnimatedState';
import { FLOATING_BUTTON_SIZE } from '#ui/FloatingButton';
import FloatingIconButton from '#ui/FloatingIconButton';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import type { TemplateKind } from './coverEditorTypes';
import type { CoverEditorSuggestionButton_profile$key } from '@azzapp/relay/artifacts/CoverEditorSuggestionButton_profile.graphql';
type CoverEditorSuggestionButtonProps = {
  profile: CoverEditorSuggestionButton_profile$key;
  sourceMedia: { kind: 'image' | 'video'; uri: string } | null;
  mediaVisible: boolean;
  iconHeight?: number;
  templateKind: TemplateKind;
  toggleMediaVisibility: () => void;
  onSelectSuggestedMedia: () => void;
};
const CoverEditorSuggestionButton = ({
  profile: profileKey,
  sourceMedia,
  templateKind,
  mediaVisible,
  toggleMediaVisibility,
  onSelectSuggestedMedia,
}: CoverEditorSuggestionButtonProps) => {
  const profile = useFragment(
    graphql`
      fragment CoverEditorSuggestionButton_profile on Profile {
        profileKind
      }
    `,
    profileKey,
  );

  const timing = useAnimatedState(
    sourceMedia != null &&
      !mediaVisible &&
      profile.profileKind === 'business' &&
      templateKind !== 'people',
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

  if (profile.profileKind === 'personal' && !sourceMedia) {
    return null;
  }

  if (
    profile.profileKind === 'business' &&
    !sourceMedia &&
    templateKind === 'people'
  ) {
    return null;
  }

  return (
    <View
      style={{
        width: FLOATING_BUTTON_SIZE,
        height: FLOATING_BUTTON_SIZE * 2 + 10,
      }}
    >
      {profile.profileKind === 'business' && templateKind !== 'people' && (
        <Animated.View
          style={[{ position: 'absolute' }, suggestionAnimatedStyle]}
        >
          <FloatingIconButton
            icon={
              templateKind === 'video' ? 'suggested_video' : 'suggested_photo'
            }
            iconSize={30}
            onPress={onSelectSuggestedMedia}
          />
        </Animated.View>
      )}
      <Animated.View
        style={[{ position: 'absolute' }, mediaVisibleAnimatedStyle]}
      >
        {sourceMedia && (
          <PressableOpacity
            style={[styles.mediaHideButton]}
            onPress={toggleMediaVisibility}
          >
            <GPUImageView
              style={[
                styles.mediaHideButtonImage,
                !mediaVisible && { opacity: 0.5 },
                { overflow: 'hidden' },
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
              icon={mediaVisible ? 'display' : 'hide'}
            />
          </PressableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

export default CoverEditorSuggestionButton;

const styles = StyleSheet.create({
  mediaHideButton: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    borderColor: colors.black,
    borderWidth: 1,
    borderStyle: 'solid',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaHideButtonImage: {
    width: FLOATING_BUTTON_SIZE - 6,
    height: FLOATING_BUTTON_SIZE - 6,
    borderRadius: (FLOATING_BUTTON_SIZE - 4) / 2,
  },
  mediaHideButtonIcon: {
    position: 'absolute',
    top: (FLOATING_BUTTON_SIZE - 24) / 2,
    left: (FLOATING_BUTTON_SIZE - 24) / 2,
    width: 24,
    height: 24,
  },
});
