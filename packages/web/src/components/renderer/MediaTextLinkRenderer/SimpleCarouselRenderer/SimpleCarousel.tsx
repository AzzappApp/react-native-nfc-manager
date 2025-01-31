'use client';
import cn from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { fontsMap } from '#helpers/fonts';
import { DEFAULT_MODULE_TEXT, DEFAULT_MODULE_TITLE } from '#helpers/modules';
import useDimensions from '#hooks/useDimensions';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import commonStyles from '../MediaTextLink.css';
import styles from './SimpleCarousel.css';
import type { CardModuleBase, Media } from '@azzapp/data';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { CardModuleMediaTextData } from '@azzapp/shared/cardModuleHelpers';
import type { CSSProperties, MouseEvent, TouchEvent } from 'react';

type Props = {
  medias: Media[];
  style?: CSSProperties;
  cardStyle: CardStyle;
  colorPalette: ColorPalette;
  module: CardModuleBase & {
    data: CardModuleMediaTextData;
  };
};

/**
 * Function to find the nearest index in snapPoints given an input value (translation).
 * @param snapPoints - Array of number names (snap points).
 * @param translation - The input value to compare against.
 * @returns The index of the nearest snap point.
 */
const findNearestIndex = (
  snapPoints: number[],
  translation: number,
): number => {
  if (snapPoints.length === 0) return -1; // Return -1 if snapPoints is empty.

  let nearestIndex = 0;
  let minDistance = Math.abs(snapPoints[0] - translation);

  for (let i = 1; i < snapPoints.length; i++) {
    const distance = Math.abs(snapPoints[i] - translation);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  return nearestIndex;
};

// start margin to avoid having text to close to the screen border
const marginStart = 20;

const SimpleCarousel = ({
  medias: baseMedias,
  style,
  cardStyle,
  module,
  colorPalette,
}: Props) => {
  const { cardModuleMedias, cardModuleColor } = module.data;
  const cardGap = Math.max(cardStyle?.gap || 0, 10);
  const [startPosition, setStartPosition] = useState<{
    position: number;
    translation: number;
  }>();
  const [translation, setTranslation] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const dimensions = useDimensions(containerRef);
  const screenWidth = dimensions?.width || 0;

  // Target Width of an element in the carousel
  const targetWidth = Math.min(400, (screenWidth * 70) / 100);

  // adapt media for width resizing
  const medias = useMemo(() => {
    return baseMedias.map(baseMedia => {
      const width = targetWidth;
      const height = baseMedia.height * (targetWidth / baseMedia.width);

      return {
        ...baseMedia,
        height,
        width,
      };
    });
  }, [baseMedias, targetWidth]);

  // compute a snapPoint for each image in the carousel
  const carouselSnapPoints = useMemo(() => {
    const snapPoints: number[] = [];
    const totalWidth =
      medias.length * targetWidth +
      (medias.length - 1) * cardGap +
      2 * marginStart;
    const maxSnapPoint = totalWidth - screenWidth;

    medias.reduce((acc, item) => {
      let snapPoint = acc + targetWidth / 2 - screenWidth / 2 + cardGap;
      if (snapPoint < 0) {
        snapPoint = 0;
      } else if (snapPoint > maxSnapPoint + marginStart) {
        snapPoint = maxSnapPoint + marginStart;
      }
      snapPoints.push(snapPoint);
      acc = acc + item.width + cardGap;
      return acc;
    }, marginStart);

    return {
      totalWidth,
      snapPoints,
      maxSnapPoint,
    };
  }, [cardGap, medias, screenWidth, targetWidth]);

  // ensure we don't try to slide non slidable row (smaller than screen width)
  const isSlidable = screenWidth < carouselSnapPoints.totalWidth;

  // padding to apply on none slidable row
  const paddingNoneSlidable = !isSlidable
    ? (carouselSnapPoints.totalWidth - 2 * marginStart - screenWidth) / 2
    : 0;

  useEffect(() => {
    setTranslation(carouselSnapPoints.snapPoints[0]);
  }, [screenWidth, carouselSnapPoints.snapPoints]);

  /**
   * Slide handling
   */
  const handleStart = (
    e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>,
  ) => {
    const track = carouselRef.current;
    if (track) {
      const startX =
        'touches' in e && e.touches
          ? e.touches[0].clientX
          : 'clientX' in e
            ? e.clientX
            : 0; // Handles both touch and mouse
      setStartPosition({ position: startX, translation });
    }
  };

  const handleMove = useCallback(
    (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
      if (startPosition === undefined) return;
      const currentX =
        'touches' in e && e.touches
          ? e.touches[0].clientX
          : 'clientX' in e
            ? e.clientX
            : 0;

      const track = carouselRef.current;
      if (track) {
        const deltaX = currentX - startPosition.position;
        const targetTranslation = startPosition.translation + deltaX;
        setTranslation(targetTranslation);
        track.style.transform = `translateX(${targetTranslation}px)`;
      }
    },
    [startPosition],
  );

  useEffect(() => {
    const current = carouselRef.current;

    const handleTouchMove: EventListener = e => {
      return handleMove(e as unknown as TouchEvent<HTMLDivElement>);
    };

    if (current) {
      // Add a non-passive touch event listener for Safari
      current.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
    }

    return () => {
      if (current) {
        current.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [startPosition, handleMove, carouselSnapPoints]);

  const handleEnd = () => {
    const track = carouselRef.current;
    if (track) {
      const targetIndex = findNearestIndex(
        carouselSnapPoints.snapPoints,
        -translation,
      );
      setTranslation(-carouselSnapPoints.snapPoints[targetIndex]);
    }
    setStartPosition(undefined);
    return;
  };

  return (
    <div ref={containerRef} style={style}>
      <div className={styles.carousel}>
        <div
          ref={carouselRef}
          onTouchStart={isSlidable ? handleStart : undefined}
          onTouchMove={isSlidable ? handleMove : undefined}
          onTouchEnd={isSlidable ? handleEnd : undefined}
          onTouchCancel={isSlidable ? handleEnd : undefined}
          onMouseDown={isSlidable ? handleStart : undefined}
          onMouseMove={isSlidable ? handleMove : undefined}
          onMouseUp={isSlidable ? handleEnd : undefined}
          onMouseLeave={isSlidable ? handleEnd : undefined}
          style={{
            transform: `translateX(${translation}px)`,
            marginLeft: `${-paddingNoneSlidable}px`,
            transition:
              startPosition !== undefined || !isSlidable
                ? 'none'
                : 'transform 0.5s ease-in-out', // Disable animation while dragging
            gap: cardGap,
            display: 'flex',
          }}
        >
          {isSlidable ? <div style={{ width: marginStart }} /> : undefined}
          {medias.map((media, i) => {
            const sectionData = cardModuleMedias.find(
              cardModuleMedia => cardModuleMedia.media.id === media.id,
            );

            return (
              <div key={`${media.id}_${i}`} className={styles.itemContainer}>
                <div key={`${media.id}_${i}`}>
                  {media.kind === 'video' ? (
                    <CloudinaryVideo
                      assetKind="module"
                      media={media}
                      alt="cover"
                      fluid
                      style={{
                        objectFit: 'cover',
                        width: '100%',
                        borderRadius: cardStyle.borderRadius,
                      }}
                      playsInline
                      autoPlay
                      muted
                      loop
                    />
                  ) : (
                    <CloudinaryImage
                      mediaId={media.id}
                      draggable={false}
                      alt="carousel"
                      width={media.width}
                      height={media.height}
                      format="auto"
                      quality="auto:best"
                      style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%',
                        borderRadius: cardStyle.borderRadius,
                      }}
                    />
                  )}
                </div>
                <h3
                  className={cn(
                    commonStyles.title,
                    fontsMap[cardStyle.titleFontFamily].className,
                  )}
                  style={{
                    color: swapColor(cardModuleColor?.title, colorPalette),
                    fontSize: cardStyle.titleFontSize,
                  }}
                >
                  {sectionData?.title ?? DEFAULT_MODULE_TITLE}
                </h3>
                <p
                  className={cn(
                    commonStyles.text,
                    fontsMap[cardStyle.fontFamily].className,
                  )}
                  style={{
                    color: swapColor(cardModuleColor?.text, colorPalette),
                    fontSize: cardStyle.fontSize,
                  }}
                >
                  {sectionData?.text ?? DEFAULT_MODULE_TEXT}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SimpleCarousel;
