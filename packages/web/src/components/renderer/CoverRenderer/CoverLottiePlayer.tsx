'use client';
import memoize from 'lodash/memoize';
import lottie from 'lottie-web';
import React, {
  forwardRef,
  use,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { COVER_FOREGROUND_BASE_COLOR } from '@azzapp/shared/coverHelpers';
import { replaceColor } from '@azzapp/shared/lottieHelpers';
import type { AnimationItem } from 'lottie-web';
import type { ForwardedRef } from 'react';

const COVER_ANIMATION_NAME = 'cover';

export type CoverLottiePlayerHandle = {
  setSpeed(speed: number): void;
  play(loop?: boolean): void;
};

const CoverLottiePlayer = (
  {
    src,
    tintColor,
    staticCover,
    onLoaded,
    onLoop,
    ...props
  }: React.HTMLProps<HTMLDivElement> & {
    tintColor: string;
    staticCover?: boolean;
    src: string;
    onLoaded?: (duration: number) => void;
    onLoop?: () => void;
  },
  ref: ForwardedRef<CoverLottiePlayerHandle>,
) => {
  const animationData = replaceColor(
    COVER_FOREGROUND_BASE_COLOR,
    tintColor,
    use(fetchLottie(src)),
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationItemRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (animationItemRef.current) {
      return;
    }

    const animationItem = lottie.loadAnimation({
      container: containerRef.current,
      animationData,
      loop: false,
      renderer: 'svg',
      name: COVER_ANIMATION_NAME,
      autoplay: false,
    });

    animationItemRef.current = animationItem;
  }, [animationData]);

  useEffect(() => {
    animationItemRef.current?.addEventListener('DOMLoaded', () => {
      onLoaded?.(animationItemRef.current?.getDuration() ?? 0);
    });
    return () => {
      animationItemRef.current?.removeEventListener('DOMLoaded');
    };
  }, [onLoaded]);

  useEffect(() => {
    animationItemRef.current?.addEventListener('loopComplete', () => {
      onLoop?.();
    });

    return () => {
      animationItemRef.current?.removeEventListener('loopComplete');
    };
  }, [onLoop]);

  useEffect(() => {
    const animationItem = animationItemRef.current;
    if (!animationItem) {
      return;
    }

    if (staticCover) {
      animationItem.goToAndStop(
        animationItem.totalFrames * 0.5,
        true,
        COVER_ANIMATION_NAME,
      );
    }
  }, [staticCover]);

  useImperativeHandle(
    ref,
    () => ({
      setSpeed(speed: number) {
        animationItemRef.current?.setSpeed(speed);
      },
      play(loop) {
        if (staticCover) {
          throw new Error('Cannot play static cover');
        }

        animationItemRef.current?.goToAndPlay(0, true, COVER_ANIMATION_NAME);
        if (loop) {
          animationItemRef.current?.setLoop(true);
        }
      },
    }),
    [staticCover],
  );

  return <div ref={containerRef} {...props} />;
};

export default forwardRef(CoverLottiePlayer);

const fetchLottie = memoize((src: string) =>
  fetch(src).then(res => res.json()),
);
