'use client';

import cn from 'classnames';
import { getCldImageUrl } from 'next-cloudinary';
import { useCallback, useEffect, useRef, useState } from 'react';
import { swapColor, DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import {
  COVER_ANIMATION_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import {
  decodeMediaId,
  getCloudinaryAssetURL,
} from '@azzapp/shared/imagesHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import CoverLottiePlayer from './CoverLottiePlayer';
import styles from './CoverRenderer.css';
import { animations } from './CoverRendererAnimations';
import CoverTextRenderer from './CoverTextRenderer';
import type { CoverLottiePlayerHandle } from './CoverLottiePlayer';
import type { Media, WebCard } from '@azzapp/data/domains';

type CoverRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'media' | 'width'
> & {
  webCard: WebCard;
  media: Media;
  staticCover?: boolean;
  width?: number;
  priority?: boolean;
};

const DEFAULT_COVER_WIDTH = 375;

const CoverRenderer = ({
  webCard,
  media,
  staticCover,
  style,
  width,
  priority,
  ...props
}: CoverRendererProps) => {
  const { coverData, cardColors, coverTitle, coverSubTitle } = webCard;

  const coverWidth = width ? width * 2 : DEFAULT_COVER_WIDTH * 2;
  const coverHeight = coverWidth / COVER_RATIO;

  const mediaAnimation = coverData?.mediaAnimation ?? null;

  const [duration, setDuration] = useState<number | null>(null);
  const [lottieDuration, setLottieDuration] = useState<number | null>(null);

  const coverLottieRef = useRef<CoverLottiePlayerHandle | null>(null);

  const onLottieLoaded = useCallback((lottieDuration: number) => {
    setLottieDuration(lottieDuration);
  }, []);

  useEffect(() => {
    if (duration && lottieDuration) {
      coverLottieRef.current?.setSpeed(lottieDuration / duration);
    }
  }, [lottieDuration, duration]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const videoReady = useRef(false);

  const playJsAnimation = useCallback(
    (animationDuration?: number) => {
      if (mediaAnimation && mediaAnimation in animations && !staticCover) {
        const container = videoRef.current ?? imageRef.current;
        container?.animate(
          animations[mediaAnimation as keyof typeof animations],
          {
            duration: (animationDuration ?? duration ?? 0) * 1000,
            iterations: 1,
          },
        );
      }
    },
    [duration, mediaAnimation, staticCover],
  );

  const onImageLoad = useCallback(() => {
    if (!staticCover) {
      setDuration(COVER_ANIMATION_DURATION / 1000);
      coverLottieRef.current?.play(true);
      playJsAnimation(COVER_ANIMATION_DURATION / 1000);
    }
  }, [staticCover, playJsAnimation]);

  const onVideoReady = useCallback(() => {
    if (!videoRef.current || videoReady.current) {
      return;
    }
    videoReady.current = true;
    let duration = videoRef.current.duration;
    if (isNaN(duration)) {
      duration = COVER_ANIMATION_DURATION;
    }
    coverLottieRef.current?.play();
    videoRef.current.play();
    setDuration(duration);
    playJsAnimation(duration);
  }, [playJsAnimation]);

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
    coverLottieRef.current?.play();
    videoRef.current?.play();
    playJsAnimation();
  }, [playJsAnimation]);

  const hasLottie = coverData?.foregroundId?.startsWith('l:') ?? false;

  if (!coverData) {
    return null;
  }

  return (
    <div
      {...props}
      style={{
        aspectRatio: `${COVER_RATIO}`,
        width,
      }}
      className={styles.content}
    >
      <div
        {...props}
        style={{
          aspectRatio: `${COVER_RATIO}`,
          backgroundColor: swapColor(
            coverData.backgroundColor ?? 'light',
            cardColors ?? DEFAULT_COLOR_PALETTE,
          ),
          width,
          ...style,
        }}
        className={styles.content}
      >
        {media != null &&
          (media.kind === 'image' ? (
            <CloudinaryImage
              ref={imageRef}
              mediaId={media.id}
              alt="cover"
              width={coverWidth}
              height={coverHeight}
              priority={priority}
              className={cn(
                styles.coverMedia,
                mediaAnimation &&
                  mediaAnimation in styles &&
                  styles[mediaAnimation as keyof typeof styles],
              )}
              fetchPriority={priority ? 'high' : 'low'}
              onLoad={onImageLoad}
            />
          ) : staticCover ? (
            <CloudinaryImage
              mediaId={media.id}
              videoThumbnail
              width={coverWidth}
              height={coverHeight}
              alt="cover"
              className={styles.coverMedia}
            />
          ) : (
            <CloudinaryVideo
              media={media}
              assetKind="cover"
              alt="cover"
              onEnded={onVideoEnd}
              onCanPlayThrough={onVideoReady}
              autoPlay={false}
              loop={false}
              className={cn(
                styles.coverMedia,
                mediaAnimation &&
                  mediaAnimation in styles &&
                  styles[mediaAnimation as keyof typeof styles],
              )}
              muted
              fluid
              posterSize={{
                width: coverWidth,
                height: coverHeight,
              }}
              playsInline
              ref={videoRefCallback}
            />
          ))}
        {coverData?.foregroundId ? (
          hasLottie ? (
            <CoverLottiePlayer
              onLoop={media.kind === 'image' ? playJsAnimation : undefined}
              ref={coverLottieRef}
              src={getCloudinaryAssetURL(
                decodeMediaId(coverData.foregroundId),
                'raw',
              )}
              tintColor={
                swapColor(
                  coverData.foregroundColor,
                  cardColors ?? DEFAULT_COLOR_PALETTE,
                ) ?? '#000'
              }
              staticCover={staticCover}
              onLoaded={onLottieLoaded}
            />
          ) : (
            <div
              style={{
                backgroundColor:
                  swapColor(
                    coverData.foregroundColor,
                    cardColors ?? DEFAULT_COLOR_PALETTE,
                  ) ?? '#000',
                WebkitMaskImage: `url(${getCldImageUrl({
                  src: decodeMediaId(coverData.foregroundId),
                  width: coverWidth,
                  height: coverHeight,
                  format: 'auto',
                })})`,
                maskImage: `url(${getCldImageUrl({
                  src: decodeMediaId(coverData.foregroundId),
                  width: coverWidth,
                  height: coverHeight,
                  format: 'auto',
                })})`,
                maskPosition: 'bottom',
                WebkitMaskPosition: 'bottom',
              }}
              className={styles.layerMedia}
            />
          )
        ) : null}
      </div>
      <CoverTextRenderer
        title={coverTitle}
        titleStyle={coverData.titleStyle}
        subTitle={coverSubTitle}
        subTitleStyle={coverData.subTitleStyle}
        colorPalette={cardColors ?? DEFAULT_COLOR_PALETTE}
        textOrientation={coverData.textOrientation}
        textPosition={coverData.textPosition}
        width={width}
      />
    </div>
  );
};

export default CoverRenderer;
