'use client';
import { useRef } from 'react';
import { useExactClick } from '#hooks';
import { Button } from '#ui';
import CloudinaryImage from '#ui/CloudinaryImage';
import type { Media } from '@azzapp/data/domains';

type CarouselMediaProps = {
  media: Media;
  imageHeight: number;
  squareRatio: boolean;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  onClick: () => void;
};

const CarouselMedia = (props: CarouselMediaProps) => {
  const {
    media,
    imageHeight,
    squareRatio,
    borderRadius,
    borderColor,
    borderWidth,
    onClick,
  } = props;

  const aspectRatio = media.width / media.height;
  const width = imageHeight * (squareRatio ? 1 : aspectRatio);

  const button = useRef<HTMLButtonElement>(null);
  useExactClick(button, onClick);

  return (
    <Button.Empty ref={button}>
      <CloudinaryImage
        draggable={false}
        key={media.id}
        mediaId={media.id}
        width={width}
        height={imageHeight}
        alt="todo"
        style={{
          minWidth: width,
          minHeight: imageHeight,
          borderRadius,
          borderColor,
          borderWidth,
          borderStyle: 'solid',
          objectFit: 'cover',
        }}
      />
    </Button.Empty>
  );
};

export default CarouselMedia;
