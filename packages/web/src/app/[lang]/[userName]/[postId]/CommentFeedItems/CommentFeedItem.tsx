import { getElapsedTime } from '@azzapp/shared/timeHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './CommentFeedItems.css';
import type { PostCommentWithProfile } from '@azzapp/data/domains';

type CommentFeedItemProps = {
  comment: PostCommentWithProfile;
};

const CommentFeedItem = (props: CommentFeedItemProps) => {
  const { comment } = props;
  const elapsedTime = getElapsedTime(new Date(comment.createdAt).getTime());

  return (
    <div className={styles.item}>
      <CloudinaryImage
        mediaId={comment.media.id}
        assetKind="cover"
        height={32}
        videoThumbnail={comment.media.kind === 'video'}
        alt="cover"
        width={20}
        style={{
          objectFit: 'cover',
          marginRight: 5,
          borderRadius: 3,
        }}
      />
      <div className={styles.content}>
        <p className={styles.comment}>
          <span className={styles.name}>
            {comment.firstName} {comment.lastName}
          </span>{' '}
          {comment.comment}
        </p>
        <span className={styles.elapsed}>
          {elapsedTime.value} {elapsedTime.kind} ago
        </span>
      </div>
    </div>
  );
};

export default CommentFeedItem;
