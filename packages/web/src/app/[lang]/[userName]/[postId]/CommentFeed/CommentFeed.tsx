'use client';
import CommentFeedActions from '../CommentFeedActions';
import CommentFeedHeader from '../CommentFeedHeader';
import CommentFeedItems from '../CommentFeedItems';
import styles from './CommentFeed.css';
import type {
  Media,
  PostCommentWithProfile,
  PostWithMedias,
  Profile,
} from '@azzapp/data/domains';

type CommentFeedProps = {
  comments: PostCommentWithProfile[];
  post: PostWithMedias;
  profile: Profile;
  media: Media;
};

const CommentFeed = (props: CommentFeedProps) => {
  const { post, profile, media, comments } = props;

  return (
    <>
      <div className={styles.feed}>
        <CommentFeedActions
          defaultPost={post}
          profile={profile}
          media={media}
        />
        <CommentFeedHeader profile={profile} media={media} />
        <CommentFeedItems
          author={profile}
          post={post}
          defaultComments={comments}
          media={media}
        />
      </div>
    </>
  );
};

export default CommentFeed;
