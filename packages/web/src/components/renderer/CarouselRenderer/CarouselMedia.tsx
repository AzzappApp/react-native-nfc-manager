'use client';
import CloudinaryImage from '#ui/CloudinaryImage';
import type { Media } from '@azzapp/data';

type CarouselMediaProps = {
  media: Media;
  imageHeight: number;
  squareRatio: boolean;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
};

const CarouselMedia = (props: CarouselMediaProps) => {
  const {
    media,
    imageHeight,
    squareRatio,
    borderRadius,
    borderColor,
    borderWidth,
  } = props;

  const aspectRatio = media.width / media.height;
  const width = imageHeight * (squareRatio ? 1 : aspectRatio);

  return (
    <div
      style={{
        width,
        height: imageHeight,
        flex: '0 0 auto',
      }}
    >
      <CloudinaryImage
        mediaId={media.id}
        draggable={false}
        key={media.id}
        width={width * 2}
        height={imageHeight * 2}
        alt="todo"
        style={{
          width: '100%',
          height: '100%',
          borderRadius,
          borderColor,
          borderWidth,
          borderStyle: 'solid',
          objectFit: 'cover',
        }}
        format="auto"
        quality="auto:best"
      />
    </div>
  );
};

export default CarouselMedia;
