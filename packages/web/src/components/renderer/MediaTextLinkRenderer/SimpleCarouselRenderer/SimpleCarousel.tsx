'use client';
import cn from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { webCardTextFontsMap, webCardTitleFontsMap } from '#helpers/fonts';
import { DEFAULT_MODULE_TEXT, DEFAULT_MODULE_TITLE } from '#helpers/modules';
import useDimensions from '#hooks/useDimensions';
import useLatestCallback from '#hooks/useLastestCallback';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import RichText from '#ui/RichText';
import commonStyles from '../MediaTextLink.css';
import styles from './SimpleCarousel.css';
import type { CardModuleBase, Media } from '@azzapp/data';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type {
  CardModuleColor,
  CardModuleMediaTextData,
} from '@azzapp/shared/cardModuleHelpers';
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

// Timeout to consider wheel move as finished
const wheelStopTimeout = 250;

// start margin to avoid having text to close to the screen border
const marginStart = 20;

/**
 * Function to find the nearest index in snapPoints given an input value (translation).
 * @param snapPoints - Array of number names (snap points).
 * @param translation - The input value to compare against.
 * @returns The index of the nearest snap point.
 */
const findNearestIndex = (
  snapPoints: number[],
  translation: number,
  direction: number,
): number => {
  if (snapPoints.length === 0) return -1; // Return -1 if snapPoints is empty.

  let nearestIndex: number = 0;
  let minDistance = Math.abs(snapPoints[0] - translation);

  for (let i = 1; i < snapPoints.length; i++) {
    const distance = Math.abs(snapPoints[i] - translation);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  if (direction > 0 && snapPoints[nearestIndex] > translation) {
    nearestIndex = nearestIndex - 1;
    if (nearestIndex < 0) {
      nearestIndex = 0;
    }
  } else if (direction < 0 && snapPoints[nearestIndex] < translation) {
    nearestIndex = nearestIndex + 1;
    if (nearestIndex > snapPoints.length - 1) {
      nearestIndex = snapPoints.length - 1;
    }
  }
  return nearestIndex;
};

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
    positionX: number;
    positionY: number;
    translation: number;
    slideDirection?: 'X' | 'Y';
    translationType?: 'touch' | 'wheel';
  }>();
  const [translation, setTranslation] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const targetTranslationRef = useRef<number>();
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

    medias.forEach((_, index) => {
      let snapPoint =
        index * cardGap +
        index * targetWidth +
        marginStart +
        targetWidth / 2 -
        screenWidth / 2;

      if (snapPoint < 0) {
        snapPoint = 0;
      } else if (snapPoint > maxSnapPoint) {
        snapPoint = maxSnapPoint;
      }
      snapPoints.push(snapPoint);
    });

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
    ? (carouselSnapPoints.totalWidth - screenWidth) / 2
    : 0;

  useEffect(() => {
    setTranslation(0);
  }, [screenWidth]);

  /**
   * Slide handling
   */
  const handleStart = (
    e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>,
  ) => {
    if (startPosition?.translationType === 'wheel') return;

    const track = carouselRef.current;
    if (track) {
      const startX =
        'touches' in e && e.touches
          ? e.touches[0].clientX
          : 'clientX' in e
            ? e.clientX
            : 0; // Handles both touch and mouse
      const startY =
        'touches' in e && e.touches
          ? e.touches[0].clientY
          : 'clientY' in e
            ? e.clientY
            : 0; // Handles both touch and mouse

      setStartPosition({
        positionX: startX,
        positionY: startY,
        translation,
        translationType: 'touch',
      });
    }
  };

  const wheelXTimeout = useRef<ReturnType<typeof setTimeout>>();
  const wheelYTimeout = useRef<ReturnType<typeof setTimeout>>();

  // function called to reset wheel slide X management
  const onWheelXTimeout = useCallback(() => {
    const track = carouselRef.current;
    if (track && startPosition && targetTranslationRef.current) {
      const direction = targetTranslationRef.current - startPosition.positionX;
      const targetIndex = findNearestIndex(
        carouselSnapPoints.snapPoints,
        -translation,
        direction,
      );
      const target = -carouselSnapPoints.snapPoints[targetIndex];
      setTranslation(target);
    }
    if (startPosition?.slideDirection === 'X') {
      setStartPosition(undefined);
    }
  }, [carouselSnapPoints.snapPoints, startPosition, translation]);

  // function called to reset wheel slide Y management
  const onWheelYTimeout = useCallback(() => {
    if (startPosition?.slideDirection === 'Y') {
      setStartPosition(undefined);
    }
  }, [startPosition?.slideDirection]);

  // handle wheel event on the row
  const handleWheel = (e: WheelEvent) => {
    // slide direction management (change and initial direction detection)
    if (
      startPosition?.slideDirection === 'Y' ||
      Math.abs(e.deltaY) > Math.abs(e.deltaX) + 2
    ) {
      // handle wheel Y sliding
      if (startPosition?.slideDirection === 'X') {
        // directly stop movement
        clearTimeout(wheelXTimeout.current);
        targetTranslationRef.current = translation;
        onWheelXTimeout();
      }

      setStartPosition(startPos => {
        return startPos?.slideDirection === 'Y'
          ? startPos
          : {
              positionX: 0,
              positionY: 0,
              translation: 0,
              slideDirection: 'Y',
              translationType: 'wheel',
            };
      });
      wheelYTimeout.current = setTimeout(onWheelYTimeout, wheelStopTimeout);
      // no need to handle this event
      return;
    } else if (
      // handle wheel X sliding

      startPosition?.slideDirection !== 'X' &&
      Math.abs(e.deltaX) > 1
    ) {
      if (startPosition?.slideDirection === 'Y') {
        // directly stop movement
        clearTimeout(wheelYTimeout.current);
      }
      setStartPosition({
        positionX: translation,
        positionY: 0,
        translation,
        slideDirection: 'X',
        translationType: 'wheel',
      });
    }

    // To not forward the event to browser if handled
    if (!startPosition) {
      e.preventDefault();
      return;
    }

    const track = carouselRef.current;
    const deltaX = e.deltaX;

    if (!track || deltaX === 0) return;

    let targetTranslation = translation - deltaX;

    // Limit sliding to avoid slide out of line
    if (targetTranslation > 0) {
      targetTranslation = 0;
    } else if (
      -targetTranslation >=
      carouselSnapPoints.totalWidth - screenWidth
    ) {
      targetTranslation = screenWidth - carouselSnapPoints.totalWidth;
    }

    if (targetTranslation !== translation) e.preventDefault();

    setTranslation(targetTranslation);
    track.style.transform = `translateX(${targetTranslation}px)`;

    clearTimeout(wheelXTimeout.current);
    targetTranslationRef.current = targetTranslation;
    wheelXTimeout.current = setTimeout(onWheelXTimeout, wheelStopTimeout);
  };

  const handleMove = (
    e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>,
  ) => {
    if (startPosition === undefined) return;
    if (startPosition.slideDirection === 'Y') return;
    if (startPosition?.translationType === 'wheel') return;

    const currentX =
      'touches' in e && e.touches
        ? e.touches[0].clientX
        : 'clientX' in e
          ? e.clientX
          : 0;

    const currentY =
      'touches' in e && e.touches
        ? e.touches[0].clientY
        : 'clientY' in e
          ? e.clientY
          : 0;

    if (startPosition.slideDirection === undefined) {
      if (Math.abs(startPosition.positionY - currentY) > 8) {
        setStartPosition(pos =>
          pos
            ? { ...pos, slideDirection: 'Y', translationType: 'touch' }
            : undefined,
        );
        // no need to handle this event
        return;
      } else if (Math.abs(startPosition.positionX - currentX) > 8) {
        setStartPosition(pos =>
          pos
            ? { ...pos, slideDirection: 'X', translationType: 'touch' }
            : undefined,
        );
      } else {
        // cannot identify direction yet
        return;
      }
    }

    e.preventDefault();
    const track = carouselRef.current;
    if (track) {
      const deltaX = currentX - startPosition.positionX;
      const targetTranslation = startPosition.translation + deltaX;
      setTranslation(targetTranslation);
      track.style.transform = `translateX(${targetTranslation}px)`;
    }
  };

  const latestMove = useLatestCallback(handleMove);
  useEffect(() => {
    const current = carouselRef.current;

    const handleTouchMove: EventListener = e => {
      return latestMove(e as unknown as TouchEvent<HTMLDivElement>);
    };

    if (current) {
      // Add a non-passive touch event listener for Safari
      current.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });

      return () => {
        if (current) {
          current.removeEventListener('touchmove', handleTouchMove);
        }
      };
    }
  }, [latestMove]);

  const latestWheel = useLatestCallback(handleWheel);
  useEffect(() => {
    if (!isSlidable) return;
    const current = carouselRef.current;

    if (current) {
      // Add a non-passive touch event listener for Safari
      current.addEventListener('wheel', latestWheel, {
        passive: false,
      });

      return () => {
        if (current) {
          current.removeEventListener('wheel', latestWheel);
        }
      };
    }
  }, [latestWheel, isSlidable]);

  const handleEnd = (
    e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>,
  ) => {
    if (!startPosition || startPosition.slideDirection === 'Y') return;

    const currentX =
      'changedTouches' in e && e.changedTouches
        ? e.changedTouches[0]?.clientX
        : 'clientX' in e
          ? e.clientX
          : 0;

    const track = carouselRef.current;
    if (track && startPosition) {
      const direction = currentX - startPosition.positionX;
      const targetIndex = findNearestIndex(
        carouselSnapPoints.snapPoints,
        -translation,
        direction,
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
              startPosition?.slideDirection === 'X' || !isSlidable
                ? 'none'
                : 'transform 0.5s ease-in-out', // Disable animation while dragging
            gap: cardGap,
            paddingLeft: marginStart,
            display: 'flex',
          }}
        >
          {medias.map((media, i) => {
            const sectionData = cardModuleMedias.find(
              cardModuleMedia => cardModuleMedia.media.id === media.id,
            );

            return (
              <SimpleCarouselItemMemo
                key={i}
                media={media}
                sectionData={sectionData}
                colorPalette={colorPalette}
                cardModuleColor={cardModuleColor}
                cardStyle={cardStyle}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SimpleCarouselItem = ({
  media,
  cardStyle,
  colorPalette,
  cardModuleColor,
  sectionData,
}: {
  media: Media;
  cardStyle: CardStyle;
  colorPalette: ColorPalette;
  cardModuleColor?: CardModuleColor;
  sectionData?: {
    title?: string;
    text?: string;
  };
}) => {
  return (
    <div
      className={styles.itemContainer}
      style={{
        width: media.width,
      }}
    >
      <div
        className={styles.imageContainer}
        style={{ borderRadius: cardStyle.borderRadius }}
      >
        {media.kind === 'video' ? (
          <CloudinaryVideo
            assetKind="module"
            className={styles.media}
            media={media}
            alt="cover"
            fluid
            style={{
              objectFit: 'cover',
              width: '100%',
            }}
            playsInline
            autoPlay
            muted
            loop
          />
        ) : (
          <CloudinaryImage
            className={styles.media}
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
            }}
          />
        )}
      </div>
      <h3
        className={cn(
          commonStyles.title,
          webCardTitleFontsMap[cardStyle.titleFontFamily].className,
        )}
        style={{
          color: swapColor(cardModuleColor?.title, colorPalette),
          fontSize: cardStyle.titleFontSize,
        }}
      >
        <RichText
          fontFamily={cardStyle.titleFontFamily}
          text={sectionData?.title ?? DEFAULT_MODULE_TITLE}
          textFontSize={cardStyle.titleFontSize || commonStyles.titleFontSize}
        />
      </h3>
      <p
        className={cn(
          commonStyles.text,
          webCardTextFontsMap[cardStyle.fontFamily].className,
        )}
        style={{
          color: swapColor(cardModuleColor?.text, colorPalette),
          fontSize: cardStyle.fontSize,
        }}
      >
        <RichText
          fontFamily={cardStyle.fontFamily}
          text={sectionData?.text ?? DEFAULT_MODULE_TEXT}
          textFontSize={cardStyle.fontSize || commonStyles.textFontSize}
        />
      </p>
    </div>
  );
};

const SimpleCarouselItemMemo = React.memo(SimpleCarouselItem);

export default SimpleCarousel;
