import Link from 'next/link';
import { getFormatedElapsedTime } from '@azzapp/shared/timeHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './CommentFeedItems.css';
import type { PostCommentWithWebCard } from '@azzapp/data/domains';

type CommentFeedItemProps = {
  comment: PostCommentWithWebCard;
};

const CommentFeedItem = (props: CommentFeedItemProps) => {
  const { comment } = props;
  const elapsedTime = getFormatedElapsedTime(
    new Date(comment.createdAt).getTime(),
  );

  return (
    <div className={styles.item}>
      <Link href={`/${comment.userName}`} className={styles.coverLink}>
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
      </Link>
      <div className={styles.content}>
        <p className={styles.comment}>
          <span className={styles.name}>{comment.userName}</span>{' '}
          {comment.comment}
        </p>
        <span className={styles.elapsed}>{elapsedTime}</span>
      </div>
    </div>
  );
};

export default CommentFeedItem;
