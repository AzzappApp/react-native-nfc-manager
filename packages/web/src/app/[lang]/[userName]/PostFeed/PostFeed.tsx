'use client';
import { useState, useTransition, useRef } from 'react';
import { CloseIcon, ShareIcon } from '#assets';
import { generateShareProfileLink } from '#helpers';
import { Button, ButtonIcon } from '#ui';
import { ProfileActions } from '#app/actions';
import DownloadAppModal from '#components/DownloadAppModal';
import ShareModal from '#components/ShareModal';
import useScrollEnd from '#hooks/useScrollEnd';
import styles from './PostFeed.css';
import PostFeedItem from './PostFeedItem';
import type { ModalActions } from '#ui/Modal';
import type {
  Profile,
  Media,
  PostWithCommentAndAuthor,
} from '@azzapp/data/domains';

type PostFeedProps = {
  profile: Profile;
  defaultPosts: PostWithCommentAndAuthor[];
  postsCount: number;
  media: Media;
  onClose: () => void;
};

const PostFeed = (props: PostFeedProps) => {
  const { profile, defaultPosts, postsCount, media, onClose } = props;

  const share = useRef<ModalActions>(null);
  const download = useRef<ModalActions>(null);
  const [posts, setPosts] = useState(defaultPosts);
  const [isPending, startTransition] = useTransition();

  const ref = useScrollEnd<HTMLDivElement>(() => {
    startTransition(async () => {
      if (isPending) return;

      const newPosts = await ProfileActions.loadProfilePostsWithTopComment(
        profile.id,
        5,
        posts.length,
      );

      setPosts(prevPosts => [...prevPosts, ...newPosts]);
    });
  }, [isPending, posts.length, profile.id]);

  return (
    <>
      <div className={styles.wrapper} ref={ref}>
        <div className={styles.header}>
          <ButtonIcon
            Icon={CloseIcon}
            onClick={onClose}
            className={styles.close}
          />
          <div className={styles.headerData}>
            <span className={styles.headerName}>{profile.userName}</span>
            <span className={styles.headerPostsCount}>{postsCount} posts</span>
            <Button
              onClick={() => download.current?.open()}
              size="small"
              className={styles.headerButton}
            >
              Follow
            </Button>
          </div>
          <span>
            <ButtonIcon
              Icon={ShareIcon}
              onClick={() => share.current?.open()}
            />
          </span>
        </div>
        {posts.map((post, i) => (
          <PostFeedItem
            key={`${post.id}-${i}`}
            media={media}
            profile={profile}
            post={post}
            onDownload={() => download.current?.open()}
          />
        ))}
      </div>
      <DownloadAppModal ref={download} profileId={profile.id} media={media} />
      <ShareModal
        ref={share}
        link={generateShareProfileLink(profile.userName)}
      />
    </>
  );
};

export default PostFeed;
