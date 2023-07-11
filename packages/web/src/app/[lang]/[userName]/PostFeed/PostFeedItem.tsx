import Link from 'next/link';
import { useRef } from 'react';
import { getElapsedTime } from '@azzapp/shared/timeHelpers';
import { CommentIcon, HearthIcon, ShareIcon } from '#assets';
import { generateSharePostLink } from '#helpers';
import { ButtonIcon } from '#ui';
import ShareModal from '#components/ShareModal';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './PostFeedItem.css';
import type { ModalActions } from '#ui/Modal';
import type {
  Media,
  PostWithCommentAndAuthor,
  Profile,
} from '@azzapp/data/domains';

type PostFeedItemProps = {
  post: PostWithCommentAndAuthor;
  media: Media;
  profile: Profile;
  onDownload: () => void;
};

const PostFeedItem = (props: PostFeedItemProps) => {
  const { post, media, profile, onDownload } = props;
  const share = useRef<ModalActions>(null);

  const elapsedTime = getElapsedTime(new Date(post.createdAt).getTime());
  const [postMedia] = post.medias as string[];

  return (
    <>
      <div className={styles.post}>
        <div className={styles.postHeader}>
          {media && (
            <CloudinaryImage
              mediaId={media.id}
              videoThumbnail={media.kind === 'video'}
              alt="cover"
              width={20}
              height={32}
              style={{
                objectFit: 'cover',
                marginRight: 5,
                borderRadius: 3,
              }}
            />
          )}
          <span>{profile.userName}</span>
        </div>
        {postMedia && (
          <div className={styles.postMedias}>
            <CloudinaryImage
              mediaId={postMedia}
              alt="cover"
              fill
              style={{
                objectFit: 'cover',
              }}
            />
          </div>
        )}
        <div className={styles.postFooter}>
          <div className={styles.postActions}>
            <ButtonIcon Icon={HearthIcon} onClick={onDownload} />
            <ButtonIcon Icon={CommentIcon} onClick={onDownload} />
            <ButtonIcon
              Icon={ShareIcon}
              onClick={() => share.current?.open()}
            />
          </div>
          <span className={styles.postCounterReactions}>
            {post.counterReactions} likes
          </span>
        </div>
        <div className={styles.postMore}>
          {post.comment && (
            <p className={styles.postComment}>
              <span className={styles.postCommentName}>
                {post.comment.author.firstName} {post.comment.author.lastName}
              </span>{' '}
              {post.comment.comment}
            </p>
          )}
          <Link className={styles.postSeeMore} href={`/post/${post.id}`}>
            See more
          </Link>
          <span className={styles.postElapsedTime}>
            {elapsedTime.value} {elapsedTime.kind} ago
          </span>
        </div>
      </div>
      <ShareModal
        ref={share}
        link={generateSharePostLink(profile.userName, post.id)}
      />
    </>
  );
};

export default PostFeedItem;
