'use client';

import cn from 'classnames';
import {
  useState,
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '#assets';
import { ButtonIcon } from '#ui';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import shadowStyles from '#ui/Styles/Shadow.css';
import styles from './FullscreenOverlayContext.css';
import type { Media } from '@azzapp/data';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { PropsWithChildren } from 'react';

type FullScreenOverlayContextProps = PropsWithChildren<{
  cardStyle: CardStyle;
}>;
export const FullScreenOverlayContext = createContext({
  setMedia: (_: Media) => {},
});

export const useFullScreenOverlayContext = (media: Media) => {
  const { setMedia } = useContext(FullScreenOverlayContext);
  return { setMedia: () => setMedia(media) };
};

const FullScreenOverlay = ({
  children,
  cardStyle,
}: FullScreenOverlayContextProps) => {
  const [media, setMedia] = useState<Media | null>(null);
  const [visibilityState, setVisibilityState] = useState(false);

  const valueMemo = useMemo(
    () => ({
      setMedia: (arg: Media | null) => {
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
        cardStyle={cardStyle}
        visibilityState={visibilityState}
        setVisibilityState={setVisibilityState}
      />
      {children}
    </FullScreenOverlayContext.Provider>
  );
};

const FullScreenMediaOverlay = ({
  media,
  cardStyle,
  visibilityState,
  setVisibilityState,
}: {
  media: Media | null;
  cardStyle: CardStyle;
  visibilityState: boolean;
  setVisibilityState: (arg: boolean) => void;
}) => {
  const ref = useRef<Element | null>(null);

  useEffect(() => {
    ref.current = document.querySelector<HTMLElement>('#portal');
  });

  if (!ref.current) {
    return undefined;
  }

  const aspectRatio = media ? media.width / media.height : 1;
  const fullscreenWidth = 900;
  const fullscreenHeight = fullscreenWidth * (media ? media.height : 16 / 9);

  const close = () => {
    setVisibilityState(false);
  };

  return createPortal(
    media ? (
      <div
        className={`${styles.background} ${visibilityState ? styles.fadeInStyle : styles.fadeOutStyle}`}
        onClick={close}
      >
        <div className={styles.mediaContainer}>
          <div className={styles.mediaWrapper}>
            <ButtonIcon
              className={styles.closeButton}
              size={20}
              Icon={CloseIcon}
              color="white"
              onClick={close}
            />
            {media.kind === 'video' ? (
              <CloudinaryVideo
                key={media.id} // This key allow to force refresh video to avoid having previous media displayed
                assetKind="module"
                className={cn(styles.media, shadowStyles.shadowLightBottom)}
                media={media}
                alt="cover"
                fluid
                style={{
                  objectFit: 'contain',
                  aspectRatio,
                  borderRadius: cardStyle.borderRadius || 0,
                }}
                playsInline
                autoPlay
                muted
                loop
              />
            ) : (
              <CloudinaryImage
                key={media.id} // This key allow to force refresh video to avoid having previous media displayed
                className={cn(styles.media, shadowStyles.shadowLightBottom)}
                mediaId={media.id}
                draggable={false}
                alt="carousel"
                width={fullscreenWidth}
                height={fullscreenHeight}
                style={{ borderRadius: cardStyle.borderRadius || 0 }}
                format="auto"
                quality="auto:best"
              />
            )}
          </div>
        </div>
      </div>
    ) : undefined,
    ref.current,
  );
};

export default FullScreenOverlay;
