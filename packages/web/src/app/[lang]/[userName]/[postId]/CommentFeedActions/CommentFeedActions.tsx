'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { getElapsedTime } from '@azzapp/shared/timeHelpers';
import { HearthIcon, ShareIcon } from '#assets';
import { generateSharePostLink } from '#helpers';
import { Button, ButtonIcon } from '#ui';
import { ProfileActions } from '#app/actions';
import DownloadAppModal from '#components/DownloadAppModal';
import ShareModal from '#components/ShareModal';
import styles from './CommentFeedActions.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, PostWithMedias, Profile } from '@azzapp/data/domains';

type CommentFeedActionsProps = {
  defaultPost: PostWithMedias;
  profile: Profile;
  media: Media;
};

const CommentFeedActions = (props: CommentFeedActionsProps) => {
  const { defaultPost, profile, media } = props;

  const [post, setPost] = useState(defaultPost);
  const share = useRef<ModalActions>(null);
  const download = useRef<ModalActions>(null);
  const elapsedTime = getElapsedTime(new Date(post.createdAt).getTime());
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const newPost = await ProfileActions.loadPostById(defaultPost.id);

      if (newPost) setPost(newPost);
    });
  }, [defaultPost.id, profile.id]);

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.actions}>
          <div className={styles.buttons}>
            <ButtonIcon
              Icon={HearthIcon}
              onClick={() => download.current?.open()}
            />
            <ButtonIcon
              Icon={ShareIcon}
              onClick={() => share.current?.open()}
            />
          </div>
          <span className={styles.likes}>{post.counterReactions} Likes</span>
        </div>
        <span className={styles.elapsed}>
          {elapsedTime.value} {elapsedTime.kind} ago
        </span>
        <div className={styles.comment}>
          <Button size="small" onClick={() => download.current?.open()}>
            Add a comment
          </Button>
        </div>
      </div>
      <ShareModal
        ref={share}
        link={generateSharePostLink(profile.userName, post.id)}
      />
      <DownloadAppModal ref={download} profile={profile} media={media} />
    </>
  );
};

export default CommentFeedActions;
