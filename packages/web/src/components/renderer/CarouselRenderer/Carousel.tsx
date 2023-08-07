'use client';

import { useRef, useState, useEffect } from 'react';
import { ArrowRightIcon } from '#assets';
import { useMediaCarousel } from '#hooks';
import { Button, ButtonIcon } from '#ui';
import CloudinaryImage from '#ui/CloudinaryImage';
import CarouselFullScreen from './CarouselFullScreen';
import styles from './CarouselRenderer.css';
import type { CarouselFullScreenActions } from './CarouselFullScreen';
import type { Media } from '@azzapp/data/domains';

type CarouselProps = {
  imageHeight: number;
  marginVertical: number;
  marginHorizontal: number;
  gap: number;
  squareRatio: boolean;
  borderRadius: number;
  borderColor: string;
  borderSize: number;
  medias: Media[];
};

const Carousel = (props: CarouselProps) => {
  const {
    imageHeight,
    marginVertical,
    marginHorizontal,
    gap,
    squareRatio,
    borderRadius,
    borderColor,
    borderSize,
    medias,
  } = props;

  const carousel = useRef<HTMLDivElement>(null);
  const { getIndexToNextPosition, positions } = useMediaCarousel(
    carousel,
    medias,
    imageHeight,
    gap,
  );

  const [displayArrows, setDisplayArrows] = useState(false);
  const modal = useRef<CarouselFullScreenActions>(null);

  const onClickRight = () => {
    const index = getIndexToNextPosition();
    const left = positions[index];
    carousel.current?.scrollTo({ left, behavior: 'smooth' });
  };

  const onClickLeft = () => {
    const index = Math.max(getIndexToNextPosition() - 2, 0);
    const left = positions[index];
    carousel.current?.scrollTo({ left, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleResize = () => {
      if (
        carousel.current?.scrollWidth &&
        carousel.current?.clientWidth &&
        carousel.current?.scrollWidth > carousel.current?.clientWidth
      ) {
        setDisplayArrows(true);
      } else {
        setDisplayArrows(false);
      }
    };

    if (document.readyState === 'complete') {
      handleResize();
    }

    window.addEventListener('load', handleResize, false);
    window.addEventListener('resize', handleResize, false);

    return () => {
      window.removeEventListener('load', handleResize, false);
      window.removeEventListener('resize', handleResize, false);
    };
  }, []);

  return (
    <>
      <div
        ref={carousel}
        style={{
          overflowX: 'auto',
          paddingTop: marginVertical,
          paddingBottom: marginVertical,
          paddingLeft: marginHorizontal,
          paddingRight: marginHorizontal,
          columnGap: gap,
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'auto',
        }}
        className={styles.content}
      >
        {displayArrows && (
          <>
            <ButtonIcon
              Icon={ArrowRightIcon}
              style={{
                position: 'absolute',
                left: 10,
                top: 'calc(50% - 18px)',
                cursor: 'pointer',
                transform: 'rotate(180deg)',
              }}
              onClick={onClickLeft}
              size={36}
            />
            <ButtonIcon
              Icon={ArrowRightIcon}
              style={{
                position: 'absolute',
                right: 10,
                top: 'calc(50% - 18px)',
                cursor: 'pointer',
              }}
              onClick={onClickRight}
              size={36}
            />
          </>
        )}
        {medias.map((media, i) => {
          const aspectRatio = media.width / media.height;
          const width = imageHeight * (squareRatio ? 1 : aspectRatio);
          return (
            <Button.Empty
              key={media.id}
              onClick={() => {
                modal.current?.open(i);
              }}
            >
              <CloudinaryImage
                draggable={false}
                key={media.id}
                mediaId={media.id}
                width={width}
                height={imageHeight}
                alt="todo"
                style={{
                  borderRadius,
                  borderColor,
                  borderWidth: borderSize,
                  borderStyle: 'solid',
                  objectFit: 'cover',
                }}
              />
            </Button.Empty>
          );
        })}
      </div>
      <CarouselFullScreen
        ref={modal}
        medias={medias}
        borderSize={borderSize}
        mediaStyle={{
          borderRadius,
          borderColor,
          borderStyle: 'solid',
          objectFit: 'cover',
        }}
      />
    </>
  );
};

export default Carousel;
