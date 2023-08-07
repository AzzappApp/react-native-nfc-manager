import { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useSwipe } from '#hooks/useSwipe';
import IconButton from '#ui/IconButton';
import CarouselImage from './CarouselImage';
import type { CarouselRawData } from './CarouselRenderer';
import type { ForwardedRef } from 'react';

type CarouselFullscreenProps = {
  images: CarouselRawData['images'];
  borderSize: number;
  borderRadius: number;
  borderColor: string;
  squareRatio: boolean;
};

export type CarouselFullscrenActions = {
  open: (index: number) => void;
  close: () => void;
};

// eslint-disable-next-line react/display-name
const CarouselFullscreen = forwardRef(
  (
    props: CarouselFullscreenProps,
    ref: ForwardedRef<CarouselFullscrenActions>,
  ) => {
    const { images, borderColor, borderRadius, borderSize, squareRatio } =
      props;

    const [displayedImage, setDisplayedImage] = useState<number | null>(null);

    const onPreviousMedia = () => {
      setDisplayedImage(prevMedia => {
        if (prevMedia === null) return 0;
        if (prevMedia === 0) return images.length - 1;
        return prevMedia - 1;
      });
    };

    const onNextMedia = () => {
      setDisplayedImage(prevMedia => {
        if (prevMedia === null) return images.length - 1;
        if (prevMedia === images.length - 1) return 0;
        return prevMedia + 1;
      });
    };

    const { onTouchStart, onTouchEnd } = useSwipe({
      onSwipeLeft: onPreviousMedia,
      onSwipeRight: onNextMedia,
    });

    useImperativeHandle(
      ref,
      () => ({
        open: (index: number) => setDisplayedImage(index),
        close: () => setDisplayedImage(null),
      }),
      [],
    );

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={displayedImage !== null}
        onRequestClose={() => setDisplayedImage(null)}
      >
        <IconButton
          icon="arrow_left"
          onPress={() => onPreviousMedia()}
          iconSize={28}
          variant="icon"
          style={styles.arrowLeft}
        />
        <IconButton
          icon="arrow_right"
          onPress={() => onNextMedia()}
          iconSize={28}
          variant="icon"
          style={styles.arrowRight}
        />
        <IconButton
          icon="close"
          onPress={() => setDisplayedImage(null)}
          iconSize={28}
          variant="icon"
          style={styles.close}
        />
        <View
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={styles.content}
        >
          {images.map((image, i) => (
            <CarouselImage
              key={i}
              borderColor={borderColor}
              borderRadius={borderRadius}
              borderSize={borderSize}
              image={image}
              index={i}
              squareRatio={squareRatio}
              displayedImage={displayedImage ?? 0}
            />
          ))}
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  arrowLeft: {
    position: 'absolute',
    left: 2,
    top: '50%',
    zIndex: 999,
    borderRadius: 28,
  },
  arrowRight: {
    position: 'absolute',
    right: 2,
    top: '50%',
    zIndex: 999,
    borderRadius: 28,
  },
  close: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 999,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    width: '100%',
    height: '100%',
    paddingVertical: 50,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CarouselFullscreen;
