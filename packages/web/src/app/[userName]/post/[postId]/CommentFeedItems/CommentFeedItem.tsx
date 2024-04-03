import Link from 'next/link';
import { getFormatedElapsedTime } from '@azzapp/shared/timeHelpers';
import CoverRenderer from '#components/renderer/CoverRenderer';
import styles from './CommentFeedItems.css';
import type { PostCommentWithWebCard } from '@azzapp/data';

type CommentFeedItemProps = {
  comment: PostCommentWithWebCard;
};

const CommentFeedItem = (props: CommentFeedItemProps) => {
  const { comment } = props;
  const elapsedTime = getFormatedElapsedTime(
    new Date(comment.PostComment.createdAt).getTime(),
  );

  return (
    <div className={styles.item}>
      <Link href={`/${comment.WebCard.userName}`} className={styles.coverLink}>
        <CoverRenderer
          width={20}
          webCard={comment.WebCard}
          media={comment.media}
          staticCover
        />
      </Link>
      <div className={styles.content}>
        <p className={styles.comment}>
          <Link className={styles.name} href={`/${comment.WebCard.userName}`}>
            {comment.WebCard.userName}
          </Link>
          {` ${comment.PostComment.comment}`}
        </p>
        <span className={styles.elapsed}>{elapsedTime}</span>
      </div>
    </div>
  );
};

export default CommentFeedItem;
