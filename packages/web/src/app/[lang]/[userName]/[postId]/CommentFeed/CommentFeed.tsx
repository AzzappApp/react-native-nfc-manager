'use client';
import CommentFeedActions from '../CommentFeedActions';
import CommentFeedHeader from '../CommentFeedHeader';
import CommentFeedItems from '../CommentFeedItems';
import styles from './CommentFeed.css';
import type {
  Media,
  PostCommentWithWebCard,
  PostWithMedias,
  WebCard,
} from '@azzapp/data/domains';

type CommentFeedProps = {
  comments: PostCommentWithWebCard[];
  post: PostWithMedias;
  webCard: WebCard;
  media: Media;
};

const CommentFeed = (props: CommentFeedProps) => {
  const { post, webCard, media, comments } = props;

  return (
    <>
      <div className={styles.feed}>
        <CommentFeedActions
          defaultPost={post}
          webCard={webCard}
          media={media}
        />
        <CommentFeedHeader webCard={webCard} media={media} />
        <div className={styles.commentsContainer}>
          <CommentFeedItems
            webCard={webCard}
            post={post}
            defaultComments={comments}
            media={media}
          />
        </div>
      </div>
    </>
  );
};

export default CommentFeed;
