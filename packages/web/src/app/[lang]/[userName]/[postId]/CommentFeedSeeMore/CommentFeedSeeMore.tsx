'use client';
import { useRef } from 'react';
import { Button } from '#ui';
import DownloadAppModal from '#components/DownloadAppModal';
import CommentFeedMoreMedia from './CommentFeedMoreMedia';
import styles from './CommentFeedSeeMore.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, PostWithMedias, WebCard } from '@azzapp/data/domains';

type CommentFeedSeeMoreProps = {
  posts: PostWithMedias[];
  webCard: WebCard;
  media: Media;
};

const CommentFeedSeeMore = (props: CommentFeedSeeMoreProps) => {
  const { webCard, media, posts } = props;
  const download = useRef<ModalActions>(null);

  return (
    <>
      <div className={styles.seeMore}>
        <div className={styles.comment}>
          <Button size="small" onClick={() => download.current?.open()}>
            Add a comment
          </Button>
        </div>
        <div className={styles.publications}>
          <p className={styles.publicationsText}>
            More publication from{' '}
            <span className={styles.name}>{webCard.userName}</span>
          </p>
          <div className={styles.medias}>
            {posts.map(post => (
              <CommentFeedMoreMedia
                key={post.id}
                post={post}
                webCard={webCard}
              />
            ))}
          </div>
        </div>
      </div>
      <DownloadAppModal ref={download} webCard={webCard} media={media} />
    </>
  );
};

export default CommentFeedSeeMore;
