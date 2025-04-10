import { createContext, useCallback, useContext, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
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
export const FullScreenOverlayContext = createContext(
  (_: CardModuleSourceMedia | null) => {},
);

// helper to manage context call
export const useFullScreenOverlayContext = () =>
  useContext(FullScreenOverlayContext);

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

  return (
    <FullScreenOverlayContext.Provider value={setMedia}>
      {children}
      <FullScreenMediaOverlay
        media={media}
        webCard={webCard}
        width={width}
        height={height}
      />
    </FullScreenOverlayContext.Provider>
  );
};

type FullScreenMediaOverlayProps = {
  media: CardModuleSourceMedia | null;
  webCard?: WebCardPreviewFullScreenOverlay_webCard$key;
  width: number;
  height: number;
};

/**
 * The component to display the preview in full screen.
 */
const FullScreenMediaOverlay = ({
  media,
  webCard: webCardKey,
  width,
  height,
}: FullScreenMediaOverlayProps) => {
  const setMedia = useFullScreenOverlayContext();

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

  const clearMedia = useCallback(() => {
    setMedia(null);
  }, [setMedia]);

  if (!media) return undefined;
  return (
    <Animated.View
      style={{
        flex: 1,
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.8)',
        height,
        width,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: media ? 'auto' : 'none',
      }}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <Pressable
        onPress={clearMedia}
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
