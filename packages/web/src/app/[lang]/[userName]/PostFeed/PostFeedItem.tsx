import Link from 'next/link';
import { useRef, forwardRef } from 'react';
import { getFormatedElapsedTime } from '@azzapp/shared/timeHelpers';
import { CommentIcon, HearthIcon, ShareIcon } from '#assets';
import { generateSharePostLink } from '#helpers';
import { ButtonIcon } from '#ui';
import CoverPreview from '#components/renderer/CoverRenderer/CoverPreview';
import ShareModal from '#components/ShareModal';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideoPlayer from '#ui/CloudinaryVideoPlayer';
import styles from './PostFeedItem.css';
import type { CloudinaryVideoPlayerActions } from '#ui/CloudinaryVideoPlayer';
import type { ModalActions } from '#ui/Modal';
import type {
  Media,
  PostWithCommentAndAuthor,
  WebCard,
} from '@azzapp/data/domains';
import type { ForwardedRef } from 'react';

type PostFeedItemProps = {
  post: PostWithCommentAndAuthor;
  media: Media;
  webCard: WebCard;
  onDownload: () => void;
  onPlay: () => void;
  onMuteChanged: (muted: boolean) => void;
  onPressAuthor: () => void;
};

const PostFeedItem = (
  props: PostFeedItemProps,
  ref: ForwardedRef<CloudinaryVideoPlayerActions>,
) => {
  const { post, media, webCard, onDownload, onPlay, onMuteChanged } = props;
  const share = useRef<ModalActions>(null);

  const elapsedTime = getFormatedElapsedTime(
    new Date(post.createdAt).getTime(),
  );
  const [postMedia] = post.medias;

  return (
    <>
      <div className={styles.post}>
        <button className={styles.postHeader} onClick={props.onPressAuthor}>
          {media && (
            <div
              style={{
                marginRight: 5,
                borderRadius: 3,
                overflow: 'hidden',
                width: '20px',
                height: '32px',
              }}
            >
              <CoverPreview media={media} webCard={webCard} />
            </div>
          )}
          <span>{webCard.userName}</span>
        </button>
        {postMedia && (
          <div
            className={styles.postMedias}
            style={{
              aspectRatio: `${postMedia.width / postMedia.height}`,
            }}
          >
            {postMedia.kind === 'video' ? (
              <>
                <CloudinaryVideoPlayer
                  ref={ref}
                  assetKind="post"
                  media={postMedia}
                  alt="cover"
                  fluid
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                  }}
                  onPlay={onPlay}
                  onMuteChanged={onMuteChanged}
                  autoPlay={false}
                />
              </>
            ) : (
              <CloudinaryImage
                mediaId={postMedia.id}
                assetKind="post"
                alt="cover"
                fill
                style={{
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        )}
        <div className={styles.postFooter}>
          <div className={styles.postActions}>
            {post.allowLikes && (
              <ButtonIcon Icon={HearthIcon} onClick={onDownload} />
            )}
            {post.allowComments && (
              <ButtonIcon Icon={CommentIcon} onClick={onDownload} />
            )}
            <ButtonIcon
              Icon={ShareIcon}
              onClick={() => share.current?.open()}
            />
          </div>
          {post.allowLikes && (
            <span className={styles.postCounterReactions}>
              {post.counterReactions} likes
            </span>
          )}
        </div>
        <div className={styles.postMore}>
          {post.content && (
            <p className={styles.postComment}>
              <span className={styles.postCommentName}>{webCard.userName}</span>{' '}
              {post.content}
            </p>
          )}
          {!post.content && post.comment && (
            <p className={styles.postComment}>
              <span className={styles.postCommentName}>
                {post.comment.author.userName}
              </span>{' '}
              {post.comment.comment}
            </p>
          )}
          <Link
            className={styles.postSeeMore}
            href={`/${webCard.userName}/${post.id}`}
          >
            See more
          </Link>
          <span className={styles.postElapsedTime}>{elapsedTime}</span>
        </div>
      </div>
      <ShareModal
        ref={share}
        link={generateSharePostLink(webCard.userName, post.id)}
      />
    </>
  );
};

export default forwardRef(PostFeedItem);
