import cn from 'classnames';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ArrowRightIcon } from '#assets';
import { ButtonIcon } from '#ui';
import useOnClickOutside from '#hooks/useOnClickOutside';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './CarouselFullScreen.css';
import type { Media } from '@azzapp/data/domains';
import type { CSSProperties, ForwardedRef, HTMLAttributes } from 'react';

type CarouselFullScreenProps = HTMLAttributes<HTMLDivElement> & {
  medias: Media[];
  mediaStyle: CSSProperties;
  borderWidth: number;
};

const CarouselFullScreen = (
  props: CarouselFullScreenProps,
  ref: ForwardedRef<CarouselFullScreenActions>,
) => {
  const { medias, mediaStyle, borderWidth, className, children, ...others } =
    props;

  const [open, setOpen] = useState(false);
  const [displayedMedia, setDisplayedMedia] = useState(0);
  const onClickOutside = useCallback(() => {
    if (open) setOpen(false);
  }, [open]);

  const window = useOnClickOutside<HTMLDivElement>(onClickOutside);

  useImperativeHandle(
    ref,
    () => ({
      open: (index: number) => {
        setDisplayedMedia(index);
        setOpen(true);
      },
      close: () => setOpen(false),
    }),
    [],
  );

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'initial';
    };
  }, [open]);

  const onPreviousMedia = () => {
    setDisplayedMedia(prevMedia => {
      if (prevMedia === 0) return medias.length - 1;
      return displayedMedia - 1;
    });
  };

  const onNextMedia = () => {
    setDisplayedMedia(prevMedia => {
      if (prevMedia === medias.length - 1) return 0;
      return displayedMedia + 1;
    });
  };

  const media = medias[displayedMedia];

  if (!open) return null;

  return createPortal(
    <div {...others} className={styles.wrapper}>
      <div ref={window} className={styles.content}>
        <ButtonIcon
          Icon={ArrowRightIcon}
          className={cn(styles.button, styles.buttonLeft)}
          style={{
            transform: 'rotate(180deg)',
          }}
          onClick={onPreviousMedia}
          size={36}
        />
        <ButtonIcon
          Icon={ArrowRightIcon}
          className={cn(styles.button, styles.buttonRight)}
          onClick={onNextMedia}
          size={36}
        />
        <div
          style={{
            position: 'relative',
            width: `${(100 / (media.height / media.width)) * 0.9}vh`,
            paddingBottom: '90vh',
          }}
        >
          <CloudinaryImage
            mediaId={media.id}
            assetKind="module"
            draggable={false}
            fill
            alt="todo"
            style={{ ...mediaStyle, borderWidth }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};
export type CarouselFullScreenActions = {
  open: (index: number) => void;
  close: () => void;
};

export default forwardRef(CarouselFullScreen);
