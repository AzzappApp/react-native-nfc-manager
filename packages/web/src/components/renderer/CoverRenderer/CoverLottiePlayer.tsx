'use client';
import memoize from 'lodash/memoize';
import lottie from 'lottie-web';
import React, { use, useCallback, useEffect, useRef } from 'react';
import { COVER_FOREGROUND_BASE_COLOR } from '@azzapp/shared/coverHelpers';
import { replaceColor } from '@azzapp/shared/lottieHelpers';
import type { AnimationItem } from 'lottie-web';

const CoverLottiePlayer = ({
  src,
  tintColor,
  paused,
  duration,
  reset,
  ...props
}: React.HTMLProps<HTMLDivElement> & {
  tintColor: string;
  paused: boolean;
  src: string;
  duration: number;
  reset: number;
}) => {
  const animationData = replaceColor(
    COVER_FOREGROUND_BASE_COLOR,
    tintColor,
    use(fetchLottie(src)),
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationItemRef = useRef<AnimationItem | null>(null);

  const createAnimation = useCallback(() => {
    if (!containerRef.current) {
      return;
    }
    const animationItem = lottie.loadAnimation({
      container: containerRef.current,
      animationData,
      autoplay: false,
      loop: false,
      renderer: 'svg',
    });
    animationItemRef.current = animationItem;
  }, [animationData]);

  useEffect(() => {
    createAnimation();
  }, [createAnimation]);

  const resetRef = useRef(reset);
  const isPlaying = useRef(!paused);

  useEffect(() => {
    const animationItem = animationItemRef.current;
    if (!animationItem) {
      return;
    }
    if (paused) {
      animationItem.pause();
      isPlaying.current = false;
    } else {
      animationItem.play();
      isPlaying.current = true;
    }
  }, [paused]);

  const setSpeed = useCallback(() => {
    const animationItem = animationItemRef.current;
    if (!animationItem) {
      return;
    }
    const speed = (animationItem.getDuration() * 1000) / duration;
    animationItem.setSpeed(speed);
  }, [duration]);

  useEffect(() => {
    setSpeed();
  }, [setSpeed]);

  useEffect(() => {
    const animationItem = animationItemRef.current;
    if (!animationItem) {
      return;
    }
    if (resetRef.current === reset) {
      return;
    }
    resetRef.current = reset;
    // TODO: it's the only way to reset animation that I found (goToAnd(Stop/Play)(0) doesn't work)
    animationItem.destroy();
    createAnimation();
    setSpeed();
    if (isPlaying.current) {
      animationItemRef.current?.play();
    }
  }, [createAnimation, setSpeed, reset]);

  return <div ref={containerRef} {...props} />;
};

export default CoverLottiePlayer;

const fetchLottie = memoize((src: string) =>
  fetch(src).then(res => res.json()),
);
