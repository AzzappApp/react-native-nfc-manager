import cn from 'classnames';
import { forwardRef, type ForwardedRef } from 'react';
import { colors } from '@azzapp/shared/colorsHelpers';
import { CommentFilledIcon, ExpandIcon, HearthFilledIcon } from '#assets';
import { ButtonIcon } from '#ui';
import { useHover } from '#hooks/useHover';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideoPlayer from '#ui/CloudinaryVideoPlayer';
import styles from './PostFeedMediaPlayer.css';
import type { CloudinaryVideoPlayerActions } from '#ui/CloudinaryVideoPlayer';
import type { Media } from '@azzapp/data';

type Props = {
  media: Media;
  onPlay: () => void;
  onMuteChanged: (muted: boolean) => void;
  reactions: number;
  comments: number;
  onClick: () => void;
};

const PostFeedMediaPlayer = (
  { media, onPlay, reactions, comments, onClick }: Props,
  ref: ForwardedRef<CloudinaryVideoPlayerActions>,
) => {
  const [player, hovering] = useHover();

  return (
    <div {...player} style={{ position: 'relative' }}>
      {media.kind === 'video' && (
        <CloudinaryVideoPlayer
          ref={ref}
          assetKind="post"
          media={media}
          alt="cover"
          fluid
          sizes="100vw"
          style={{
            width: '100%',
          }}
          onPlay={onPlay}
          autoPlay={false}
          className={cn(styles.postMedia)}
          mutable={hovering}
        />
      )}
      {media.kind === 'image' && (
        <div
          style={{
            width: '100%',
            aspectRatio: `${media.width / media.height}`,
          }}
        >
          <CloudinaryImage
            mediaId={media.id}
            alt="cover"
            fill
            sizes="100vw"
            className={cn(styles.postMedia)}
            format="auto"
          />
        </div>
      )}
      <ButtonIcon
        Icon={ExpandIcon}
        style={{ width: 20, height: 20 }}
        aria-label="Expand"
        color={colors.white}
        className={cn(styles.expand, { [styles.expandOpen]: hovering })}
        onClick={onClick}
      />
      <div
        className={cn(styles.reactions, { [styles.reactionsOpen]: hovering })}
      >
        <HearthFilledIcon
          style={{ width: 20, height: 20 }}
          aria-label="Reactions"
          color={colors.white}
        />
        <span className={styles.reaction}>{reactions}</span>
        <CommentFilledIcon
          style={{ width: 20, height: 20 }}
          aria-label="Comments"
          color={colors.white}
        />
        <span className={styles.reaction}>{comments}</span>
      </div>
      <div className={cn(styles.shadow, { [styles.shadowActive]: hovering })} />
    </div>
  );
};

export default forwardRef(PostFeedMediaPlayer);
