import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors, shadow } from '#theme';
import Icon from '#ui/Icon';
import CardModuleMediaSelector from './cardModules/CardModuleMediaSelector';
import type { WebCardPreviewFullScreenOverlay_webCard$key } from '#relayArtifacts/WebCardPreviewFullScreenOverlay_webCard.graphql';
import type { CardModuleSourceMedia } from './cardModules/cardModuleEditorType';

type FullScreenOverlayContextProps = {
  children: React.ReactNode;
  webCard?: WebCardPreviewFullScreenOverlay_webCard$key;
  width: number;
  height: number;
};
export const FullScreenOverlayContext = createContext({
  setMedia: (_: CardModuleSourceMedia) => {},
});

// helper to manage context call
export const useFullScreenOverlayContext = (media: CardModuleSourceMedia) => {
  const { setMedia } = useContext(FullScreenOverlayContext);
  return { setMedia: () => setMedia(media) };
};

/**
 * This component is used to display the overlay when user click on a content
 * It defined a context and include a subView to display the clicked media
 */
export const FullScreenOverlay = ({
  children,
  webCard,
  width,
  height,
}: FullScreenOverlayContextProps) => {
  const [media, setMedia] = useState<CardModuleSourceMedia | null>(null);
  const [visibilityState, setVisibilityState] = useState(false);

  const valueMemo = useMemo(
    () => ({
      setMedia: (arg: CardModuleSourceMedia | null) => {
        setMedia(arg);
        setVisibilityState(true);
      },
    }),
    [],
  );

  return (
    <FullScreenOverlayContext.Provider value={valueMemo}>
      <FullScreenMediaOverlay
        media={media}
        webCard={webCard}
        visibilityState={visibilityState}
        setVisibilityState={setVisibilityState}
        width={width}
        height={height}
      />
      {children}
    </FullScreenOverlayContext.Provider>
  );
};

type FullScreenMediaOverlayProps = {
  media: CardModuleSourceMedia | null;
  webCard?: WebCardPreviewFullScreenOverlay_webCard$key;
  visibilityState: boolean;
  setVisibilityState: (arg: boolean) => void;
  width: number;
  height: number;
};

/**
 * The component to display the preview in full screen.
 */
const FullScreenMediaOverlay = ({
  media,
  webCard: webCardKey,
  visibilityState,
  setVisibilityState,
  width,
  height,
}: FullScreenMediaOverlayProps) => {
  const onPress = () => {
    setVisibilityState(false);
  };
  const webCard = useFragment(
    graphql`
      fragment WebCardPreviewFullScreenOverlay_webCard on WebCard {
        cardStyle {
          borderRadius
        }
      }
    `,
    webCardKey,
  );
  // compute expected image sizes
  const aspectRatio = media ? media.width / media.height : 1;
  let fullscreenWidth = Math.min(900, width - 60);
  let fullscreenHeight = fullscreenWidth / aspectRatio;
  if (fullscreenHeight > (height * 90) / 100) {
    fullscreenHeight = (height * 90) / 100;
    fullscreenWidth = fullscreenHeight * aspectRatio;
  }

  // manage display animation
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(visibilityState ? 1 : 0, { duration: 300 });
  }, [opacity, visibilityState]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!media) return undefined;
  return (
    <Animated.View
      style={[
        {
          flex: 1,
          position: 'absolute',
          backgroundColor: 'rgba(0,0,0,0.8)',
          height,
          width,
          zIndex: 10,
          justifyContent: 'center',
          alignItems: 'center',
        },
        !visibilityState && {
          pointerEvents: 'box-none',
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={{
          height,
          width,
          position: 'absolute',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CardModuleMediaSelector
          key={media.id}
          media={media}
          dimension={{
            width: fullscreenWidth,
            height: fullscreenHeight,
          }}
          imageStyle={{
            borderRadius: webCard?.cardStyle?.borderRadius ?? 0,
            maxWidth: 900,
            maxHeight: '90%',
            ...shadow({ appearance: 'dark', direction: 'bottom' }),
          }}
          canPlay
          priority="high"
        />

        <View
          style={{
            position: 'absolute',
            top: (height - fullscreenHeight) / 2 - 20,
            left: (width - fullscreenWidth) / 2 - 20,
          }}
        >
          <Icon
            width={20}
            icon="close"
            style={{
              tintColor: colors.white,
            }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const DESKTOP_PREVIEW_WIDTH = 900;
