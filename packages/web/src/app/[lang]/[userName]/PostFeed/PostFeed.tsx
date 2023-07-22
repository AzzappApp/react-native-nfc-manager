'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { generateShareProfileLink } from '#helpers';
import { ProfileActions } from '#app/actions';
import DownloadAppModal from '#components/DownloadAppModal';
import ShareModal from '#components/ShareModal';
import useScrollEnd from '#hooks/useScrollEnd';
import styles from './PostFeed.css';
import PostFeedHeader from './PostFeedHeader';
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
        COUNT_POSTS_TO_FETCH,
        posts.length,
      );

      setPosts(prevPosts => [...prevPosts, ...newPosts]);
    });
  }, [isPending, posts.length, profile.id]);

  useEffect(() => {
    startTransition(async () => {
      const refreshed = await ProfileActions.loadProfilePostsWithTopComment(
        profile.id,
        COUNT_POSTS_TO_FETCH,
      );

      setPosts(refreshed);
    });
  }, [profile.id]);

  return (
    <>
      <div className={styles.wrapper} ref={ref}>
        <PostFeedHeader
          profile={profile}
          postsCount={postsCount}
          media={media}
          onClose={onClose}
        />
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
      <DownloadAppModal ref={download} profile={profile} media={media} />
      <ShareModal
        ref={share}
        link={generateShareProfileLink(profile.userName)}
      />
    </>
  );
};

const COUNT_POSTS_TO_FETCH = 5;

export default PostFeed;
