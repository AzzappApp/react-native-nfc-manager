'use client';
import { Suspense, useCallback, useRef, useState } from 'react';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_ANIMATION_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import {
  decodeMediaId,
  getCloudinaryAssetURL,
  getImageURL,
} from '@azzapp/shared/imagesHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import CoverLottiePlayer from './CoverLottiePlayer';
import styles from './CoverRenderer.css';
import type { Media, WebCard } from '@azzapp/data/domains';

type CoverPreviewProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'media'
> & {
  webCard: WebCard;
  media: Media;
};

const CoverPreview = ({ webCard, media, ...props }: CoverPreviewProps) => {
  const { coverData, cardColors } = webCard;

  const [animationDuration, setAnimationDuration] = useState<number | null>(
    null,
  );
  const [animationLoop, setAnimationLoop] = useState(0);

  const onImageReady = useCallback(() => {
    setAnimationDuration(COVER_ANIMATION_DURATION);
    setInterval(() => {
      setAnimationLoop(animationLoop => animationLoop + 1);
    }, COVER_ANIMATION_DURATION);
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoReady = useRef(false);

  const onVideoReady = useCallback(() => {
    if (!videoRef.current || videoReady.current) {
      return;
    }
    videoReady.current = true;
    let duration = videoRef.current.duration;
    if (isNaN(duration)) {
      duration = COVER_ANIMATION_DURATION;
    } else {
      duration *= 1000;
    }
    videoRef.current.play();
    setAnimationDuration(duration);
  }, []);

  const videoRefCallback = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (videoRef.current && videoRef.current.readyState >= 4) {
        onVideoReady();
      }
    },
    [onVideoReady],
  );

  const onVideoEnd = useCallback(() => {
    setAnimationLoop(animationLoop => animationLoop + 1);
    videoRef.current?.play();
  }, []);

  if (!coverData) {
    return null;
  }

  const {
    foregroundId,
    backgroundColor,
    foregroundColor,
    backgroundId,
    backgroundPatternColor,
  } = coverData;

  const isForegroundLottie = foregroundId?.startsWith('l:');

  const readyToPlay = animationDuration != null;

  return (
    <div
      {...props}
      style={{
        aspectRatio: `${COVER_RATIO}`,
        backgroundColor: swapColor(
          backgroundColor ?? 'light',
          cardColors ?? DEFAULT_COLOR_PALETTE,
        ),
        ...props.style,
      }}
      className={styles.content}
    >
      {backgroundId && (
        <div
          style={{
            backgroundColor:
              swapColor(
                backgroundPatternColor,
                cardColors ?? DEFAULT_COLOR_PALETTE,
              ) ?? '#000',
            WebkitMaskImage: `url(${getImageURL(backgroundId)})`,
            maskImage: `url(${getImageURL(backgroundId)})`,
          }}
          className={styles.layerMedia}
        />
      )}
      {media != null &&
        (media.kind === 'image' ? (
          <CloudinaryImage
            mediaId={media.id}
            assetKind="cover"
            alt="background"
            sizes="100vw"
            fill
            priority
            className={styles.coverMedia}
            onLoad={onImageReady}
          />
        ) : (
          <CloudinaryVideo
            ref={videoRefCallback}
            media={media}
            assetKind="cover"
            alt="background"
            className={styles.coverMedia}
            muted
            fluid
            playsInline
            onEnded={onVideoEnd}
            onCanPlayThrough={onVideoReady}
            autoPlay={false}
            loop={false}
          />
        ))}
      {foregroundId &&
        (isForegroundLottie ? (
          <Suspense fallback={null}>
            <CoverLottiePlayer
              src={getCloudinaryAssetURL(decodeMediaId(foregroundId), 'raw')}
              tintColor={
                swapColor(
                  foregroundColor,
                  cardColors ?? DEFAULT_COLOR_PALETTE,
                ) ?? '#000'
              }
              className={styles.layerMedia}
              paused={!readyToPlay}
              duration={animationDuration ?? COVER_ANIMATION_DURATION}
              reset={animationLoop}
            />
          </Suspense>
        ) : (
          <div
            style={{
              backgroundColor:
                swapColor(
                  foregroundColor,
                  cardColors ?? DEFAULT_COLOR_PALETTE,
                ) ?? '#000',
              WebkitMaskImage: `url(${getImageURL(foregroundId)})`,
              maskImage: `url(${getImageURL(foregroundId)})`,
            }}
            className={styles.layerMedia}
          />
        ))}
    </div>
  );
};

export default CoverPreview;
