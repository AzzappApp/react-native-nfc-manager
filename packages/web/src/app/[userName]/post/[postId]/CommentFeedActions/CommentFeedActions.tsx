'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { getFormatedElapsedTime } from '@azzapp/shared/timeHelpers';
import { HearthIcon, ShareIcon } from '#assets';
import { generateSharePostLink } from '#helpers';
import { Button, ButtonIcon } from '#ui';
import { ProfileActions } from '#app/actions';
import DownloadAppModal from '#components/DownloadAppModal';
import ShareModal from '#components/ShareModal';
import styles from './CommentFeedActions.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, PostWithMedias, WebCard } from '@azzapp/data';

type CommentFeedActionsProps = {
  defaultPost: PostWithMedias;
  webCard: WebCard;
  media: Media;
};

const CommentFeedActions = (props: CommentFeedActionsProps) => {
  const { defaultPost, webCard, media } = props;

  const [post, setPost] = useState(defaultPost);
  const share = useRef<ModalActions>(null);
  const download = useRef<ModalActions>(null);
  const elapsedTime = getFormatedElapsedTime(
    new Date(post.createdAt).getTime(),
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const newPost = await ProfileActions.loadPostById(defaultPost.id);

      if (newPost) setPost(newPost);
    });
  }, [defaultPost.id]);

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.actions}>
          <div className={styles.buttons}>
            {post.allowLikes && (
              <ButtonIcon
                Icon={HearthIcon}
                onClick={() => download.current?.open()}
                aria-label="Like post"
              />
            )}
            <ButtonIcon
              Icon={ShareIcon}
              onClick={() => share.current?.open()}
              aria-label="Comment post"
            />
          </div>
          {post.allowLikes && (
            <span className={styles.likes}>{post.counterReactions} Likes</span>
          )}
        </div>
        <span className={styles.elapsed}>{elapsedTime}</span>
        {post.allowComments && (
          <div className={styles.comment}>
            <Button size="small" onClick={() => download.current?.open()}>
              Add a comment
            </Button>
          </div>
        )}
      </div>
      <ShareModal
        ref={share}
        link={generateSharePostLink(webCard.userName, post.id)}
      />
      <DownloadAppModal ref={download} webCard={webCard} media={media} />
    </>
  );
};

export default CommentFeedActions;
