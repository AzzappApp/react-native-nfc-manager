'use client';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { FormattedMessage } from 'react-intl';
import { type Media, type PostWithMedias, type WebCard } from '@azzapp/data';
import { Button } from '#ui';

import { loadOtherPosts } from '#app/actions/profileActions';
import DownloadAppModal from '#components/DownloadAppModal';
import CommentFeedMoreMedia from './CommentFeedMoreMedia';
import styles from './CommentFeedSeeMore.css';
import type { ModalActions } from '#ui/Modal';

type CommentFeedSeeMoreProps = {
  posts: PostWithMedias[];
  webCard: WebCard;
  media: Media;
  postId: string;
};

const CommentFeedSeeMore = (props: CommentFeedSeeMoreProps) => {
  const { webCard, media, posts } = props;

  const download = useRef<ModalActions>(null);

  const [postsList, setPostsList] = useState(posts);

  const [hasMorePosts, setHasMorePosts] = useState(true);

  const [isPending, startTransition] = useTransition();

  const fetchMorePosts = useCallback(() => {
    startTransition(async () => {
      if (isPending) return;

      const lastPost = postsList.at(-1);

      const newPosts = await loadOtherPosts(
        webCard.id,
        3,
        props.postId,
        lastPost ? new Date(lastPost.createdAt) : undefined,
      );

      setPostsList(prevPosts => {
        if (!prevPosts) return newPosts;
        return [...prevPosts, ...newPosts];
      });

      if (newPosts.length < 3) {
        setHasMorePosts(false);
      }
    });
  }, [isPending, postsList, webCard.id, props.postId]);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMorePosts) {
          fetchMorePosts();
        }
      },
      { threshold: 1 },
    );
    const observed = observerTarget.current;
    if (observed) {
      observer.observe(observed);
    }

    return () => {
      if (observed) {
        observer.unobserve(observed);
      }
    };
  }, [fetchMorePosts, hasMorePosts, observerTarget]);

  return (
    <>
      <div className={styles.seeMore}>
        <div className={styles.comment}>
          <Button size="small" onClick={() => download.current?.open()}>
            <FormattedMessage
              defaultMessage="Add a comment"
              id="pjM5zZ"
              description="Add a comment button in comment feed"
            />
          </Button>
        </div>
        <div className={styles.publications}>
          <p className={styles.publicationsText}>
            <FormattedMessage
              defaultMessage="More publication from"
              id="QFG2HO"
              description="More publications title in comment feed"
            />
            <span className={styles.name}> {webCard.userName}</span>
          </p>
          <div className={styles.medias}>
            {postsList.map(post => (
              <CommentFeedMoreMedia
                key={post.id}
                post={post}
                webCard={webCard}
              />
            ))}
          </div>
        </div>
      </div>
      <div ref={observerTarget} />
      <DownloadAppModal ref={download} webCard={webCard} media={media} />
    </>
  );
};

export default CommentFeedSeeMore;
