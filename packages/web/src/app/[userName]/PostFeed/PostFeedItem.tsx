import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, forwardRef } from 'react';
import { getFormatedElapsedTime } from '@azzapp/shared/timeHelpers';
import { CommentIcon, HearthIcon, ShareIcon } from '#assets';
import { ButtonIcon } from '#ui';
import CoverRenderer from '#components/renderer/CoverRenderer';
import ShareModal from '#components/ShareModal';
import { generateSharePostLink } from '#helpers/link';
import styles from './PostFeedItem.css';
import PostFeedMediaPlayer from './PostFeedMediaPlayer';
import type { CloudinaryVideoPlayerActions } from '#ui/CloudinaryVideoPlayer';
import type { ModalActions } from '#ui/Modal';
import type { Media, PostWithCommentAndAuthor, WebCard } from '@azzapp/data';
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
  const router = useRouter();

  const elapsedTime = getFormatedElapsedTime(
    new Date(post.createdAt).getTime(),
  );
  const [postMedia] = post.medias;

  return (
    <>
      <div className={styles.post}>
        <button className={styles.postHeader} onClick={props.onPressAuthor}>
          {media && (
            <div className={styles.postAuthorCover}>
              <CoverRenderer
                media={media}
                webCard={webCard}
                width={20}
                staticCover
              />
            </div>
          )}
          <span className={styles.postAuthorUsername}>{webCard.userName}</span>
        </button>
        {postMedia && (
          <div className={styles.postMedias}>
            <PostFeedMediaPlayer
              ref={ref}
              media={postMedia}
              onPlay={onPlay}
              onMuteChanged={onMuteChanged}
              reactions={post.counterReactions}
              comments={post.counterComments}
              onClick={() =>
                router.push(`/${webCard.userName}/post/${post.id}`)
              }
            />
          </div>
        )}
        <div className={styles.postFooter}>
          <div className={styles.postActions}>
            {post.allowLikes && (
              <ButtonIcon
                Icon={HearthIcon}
                onClick={onDownload}
                aria-label="Like post"
              />
            )}
            {post.allowComments && (
              <ButtonIcon
                Icon={CommentIcon}
                onClick={onDownload}
                aria-label="Comment post"
              />
            )}
            <ButtonIcon
              Icon={ShareIcon}
              aria-label="Share post"
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
            href={`/${webCard.userName}/post/${post.id}`}
          >
            See post details
          </Link>
          <span className={styles.postElapsedTime}>{elapsedTime}</span>
        </div>
      </div>
      {webCard.userName && (
        <ShareModal
          ref={share}
          link={generateSharePostLink(webCard.userName, post.id)}
        />
      )}
    </>
  );
};

export default forwardRef(PostFeedItem);
