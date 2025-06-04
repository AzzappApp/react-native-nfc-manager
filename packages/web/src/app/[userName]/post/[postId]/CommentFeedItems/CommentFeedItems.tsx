'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { FormattedMessage } from 'react-intl';
import { CommentIcon } from '#assets';
import { useScrollEnd } from '#hooks';
import { Button } from '#ui';
import { ProfileActions } from '#app/actions';
import { vars } from '#app/theme.css';
import CommentFeedItem from './CommentFeedItem';
import styles from './CommentFeedItems.css';
import type {
  WebCard,
  Media,
  PostCommentWithWebCard,
  PostWithMedias,
} from '@azzapp/data';

type CommentFeedItemsProps = {
  post: PostWithMedias;
  defaultComments: PostCommentWithWebCard[];
  webCard: WebCard;
  media: Media;
};

const CommentFeedItems = (props: CommentFeedItemsProps) => {
  const { post, defaultComments, webCard, media } = props;
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState(defaultComments);

  const fetchMoreComments = useCallback(() => {
    startTransition(async () => {
      if (isPending) return;

      const newComments = await ProfileActions.loadPostCommentsWithProfile(
        post.id,
        COUNT_COMMENTS_TO_FETCH,
        comments && comments.length > 0
          ? new Date(comments[comments.length - 1].PostComment.createdAt)
          : undefined,
      );

      setComments(prevComments => {
        if (!prevComments) return newComments;
        return [...prevComments, ...newComments];
      });
    });
  }, [isPending, comments, post.id]);

  const ref = useScrollEnd<HTMLDivElement>(() => {
    fetchMoreComments();
  }, [fetchMoreComments]);

  useEffect(() => {
    startTransition(async () => {
      const refreshed = await ProfileActions.loadPostCommentsWithProfile(
        post.id,
        COUNT_COMMENTS_TO_FETCH,
      );
      setComments(refreshed);
    });
  }, [post.id]);

  return (
    <>
      <div className={styles.feed} ref={ref}>
        {post.content && (
          <CommentFeedItem
            comment={{
              PostComment: {
                id: '',
                comment: post.content,
                createdAt: post.createdAt,
                postId: post.id,
                webCardId: webCard.id,
                deleted: false,
                deletedBy: null,
                deletedAt: null,
              },
              WebCard: webCard,
              media,
            }}
          />
        )}
        {comments.map(comment => {
          return (
            <CommentFeedItem key={comment.PostComment.id} comment={comment} />
          );
        })}
        {post.allowComments && comments.length === 0 && (
          <div className={styles.empty}>
            <CommentIcon height={48} width={48} color={vars.color.grey100} />
            <span className={styles.emptyText}>No comment</span>
          </div>
        )}
      </div>
      {comments.length < post.counterComments && (
        <div>
          <Button.Empty
            className={styles.button}
            onClick={() => fetchMoreComments()}
          >
            <FormattedMessage
              defaultMessage="See more comments"
              id="tTogKI"
              description="See more comments button in comment feed"
            />
          </Button.Empty>
        </div>
      )}
    </>
  );
};

const COUNT_COMMENTS_TO_FETCH = 5;

export default CommentFeedItems;
