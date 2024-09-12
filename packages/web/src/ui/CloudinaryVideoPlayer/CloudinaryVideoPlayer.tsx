'use client';
import cn from 'classnames';
import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { PlayIcon, SoundOffIcon, SoundOnIcon } from '#assets';
import ButtonIcon from '../ButtonIcon';
import CloudinaryVideo from '../CloudinaryVideo';
import styles from './CloudinaryVideoPlayer.css';
import type { CloudinaryVideoProps } from '../CloudinaryVideo';
import type { ForwardedRef } from 'react';

type CloudinaryVideoPlayerProps = CloudinaryVideoProps & {
  onMuteChanged?: (muted: boolean) => void;
  mutable?: boolean;
};

const CloudinaryVideoPlayer = (
  props: CloudinaryVideoPlayerProps,
  ref: ForwardedRef<CloudinaryVideoPlayerActions>,
) => {
  const { autoPlay = true, mutable, onMuteChanged, ...others } = props;
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(autoPlay);

  const toggleMuted = useCallback(() => {
    setMuted(prevMuted => {
      onMuteChanged?.(!prevMuted);
      return !prevMuted;
    });
  }, [onMuteChanged]);

  const togglePlaying = useCallback(() => {
    setPlaying(prevPlaying => {
      if (prevPlaying) video.current?.pause();
      else video.current?.play();

      return !prevPlaying;
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        video.current?.play();
        setPlaying(true);
      },
      pause: () => {
        video.current?.pause();
        setPlaying(false);
      },
      mute: (propagate?: boolean) => {
        setMuted(true);
        if (propagate) onMuteChanged?.(true);
      },
      unmute: (propagate?: boolean) => {
        setMuted(false);
        if (propagate) onMuteChanged?.(false);
      },
    }),
    [onMuteChanged],
  );

  return (
    <div
      className={cn(styles.container, {
        [styles.containerFluid]: others.fluid,
      })}
    >
      <CloudinaryVideo
        ref={video}
        {...others}
        loop={true}
        onClick={togglePlaying}
        muted={muted}
        autoPlay={autoPlay}
      />
      <ButtonIcon
        Icon={muted ? SoundOffIcon : SoundOnIcon}
        size={18}
        aria-label={muted ? 'Unmute' : 'Mute'}
        width={28}
        height={28}
        className={cn(styles.sound, {
          [styles.soundOpen]: mutable,
        })}
        onClick={toggleMuted}
      />
      {!playing && (
        <ButtonIcon
          Icon={PlayIcon}
          size={72}
          onClick={togglePlaying}
          className={styles.play}
          aria-label="Play"
        />
      )}
    </div>
  );
};

export default forwardRef(CloudinaryVideoPlayer);

export type CloudinaryVideoPlayerActions = {
  play: () => void;
  pause: () => void;
  mute: (propagate: boolean) => void;
  unmute: (propagate: boolean) => void;
};
