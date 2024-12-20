'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { FormattedMessage } from 'react-intl';
import { getFormatedElapsedTime } from '@azzapp/shared/timeHelpers';
import { HearthIcon, ShareIcon } from '#assets';
import { generateSharePostLink } from '#helpers';
import { Button, ButtonIcon } from '#ui';
import { ProfileActions } from '#app/actions';
import DownloadAppModal from '#components/DownloadAppModal';
import ShareModal from '#components/ShareModal';
import PostLikesModal from '../PostLikesModal/PostLikesModal';
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

  const likes = useRef<ModalActions>(null);

  useEffect(() => {
    startTransition(async () => {
      const newPost = await ProfileActions.loadPostById(defaultPost.id);

      if (newPost) setPost(newPost);
    });
  }, [defaultPost.id]);

  if (!webCard.userName) return undefined;

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
            <Button
              variant="secondary"
              onClick={() => {
                likes.current?.open();
              }}
            >
              <span className={styles.likes}>
                {post.counterReactions} Likes
              </span>
            </Button>
          )}
        </div>
        <span className={styles.elapsed}>{elapsedTime}</span>
        {post.allowComments && (
          <div className={styles.comment}>
            <Button size="small" onClick={() => download.current?.open()}>
              <FormattedMessage
                defaultMessage="Add a comment"
                id="pjM5zZ"
                description="Add a comment button in comment feed"
              />
            </Button>
          </div>
        )}
      </div>
      <ShareModal
        ref={share}
        link={generateSharePostLink(webCard.userName, post.id)}
      />
      <DownloadAppModal ref={download} webCard={webCard} media={media} />
      <PostLikesModal postId={post.id} ref={likes} />
    </>
  );
};

export default CommentFeedActions;
