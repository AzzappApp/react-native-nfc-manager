'use client';
import { useCallback, useRef, useState } from 'react';
import { PlayIcon, SoundOffIcon, SoundOnIcon } from '#assets';
import ButtonIcon from '../ButtonIcon';
import CloudinaryVideo from '../CloudinaryVideo';
import styles from './CloudinaryVideoPlayer.css';
import type { CloudinaryVideoProps } from '../CloudinaryVideo';

const CloudinaryVideoPlayer = (props: CloudinaryVideoProps) => {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(VIDEO_AUTOPLAY);

  const toggleMuted = useCallback(() => {
    setMuted(prevMuted => {
      return !prevMuted;
    });
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying(prevPlaying => {
      if (prevPlaying) video.current?.pause();
      else video.current?.play();

      return !prevPlaying;
    });
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <CloudinaryVideo
        ref={video}
        {...props}
        loop={true}
        onClick={togglePlaying}
        muted={muted}
        autoPlay={VIDEO_AUTOPLAY}
      />
      <ButtonIcon
        Icon={muted ? SoundOffIcon : SoundOnIcon}
        size={18}
        width={28}
        height={28}
        className={styles.sound}
        onClick={toggleMuted}
      />
      {!playing && (
        <ButtonIcon
          Icon={PlayIcon}
          size={72}
          onClick={togglePlaying}
          className={styles.play}
        />
      )}
    </div>
  );
};

export default CloudinaryVideoPlayer;

const VIDEO_AUTOPLAY = true;
