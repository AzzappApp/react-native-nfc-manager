'use client';
import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { generateShareProfileLink } from '#helpers';
import { ProfileActions } from '#app/actions';
import DownloadAppModal from '#components/DownloadAppModal';
import ShareModal from '#components/ShareModal';
import useScrollEnd from '#hooks/useScrollEnd';
import styles from './PostFeed.css';
import PostFeedHeader from './PostFeedHeader';
import PostFeedItem from './PostFeedItem';
import type { CloudinaryVideoPlayerActions } from '#ui/CloudinaryVideoPlayer';
import type { ModalActions } from '#ui/Modal';
import type { Media, PostWithCommentAndAuthor, WebCard } from '@azzapp/data';

type PostFeedProps = {
  webCard: WebCard;
  defaultPosts: PostWithCommentAndAuthor[];
  postsCount: number;
  media: Media;
  onClose: () => void;
  onPressAuthor: () => void;
  background?: string;
};

const PostFeed = (props: PostFeedProps) => {
  const { webCard, defaultPosts, postsCount, media, onClose, background } =
    props;

  const share = useRef<ModalActions>(null);
  const download = useRef<ModalActions>(null);
  const [posts, setPosts] = useState(defaultPosts);
  const [isPending, startTransition] = useTransition();

  const videos = useRef<Array<CloudinaryVideoPlayerActions | null>>([]);

  useEffect(() => {
    videos.current = videos.current.slice(0, posts.length);
  }, [posts]);

  useEffect(() => {
    const firstVideoIndex = defaultPosts.findIndex(post =>
      post.medias.find(media => media.kind === 'video'),
    );

    if (firstVideoIndex >= 0) videos.current?.[firstVideoIndex]?.play();
  }, [defaultPosts]);

  const ref = useScrollEnd<HTMLDivElement>(() => {
    startTransition(async () => {
      if (isPending) return;

      const newPosts = await ProfileActions.loadProfilePostsWithTopComment(
        webCard.id,
        COUNT_POSTS_TO_FETCH,
        posts.length,
      );

      setPosts(prevPosts => [...prevPosts, ...newPosts]);
    });
  }, [isPending, posts.length, webCard.id]);

  useEffect(() => {
    startTransition(async () => {
      const refreshed = await ProfileActions.loadProfilePostsWithTopComment(
        webCard.id,
        COUNT_POSTS_TO_FETCH,
      );

      setPosts(refreshed);
    });
  }, [webCard.id]);

  const onVideoPlay = useCallback((playedVideoIndex: number) => {
    videos.current.forEach((video, i) => {
      if (i !== playedVideoIndex) video?.pause();
    });
  }, []);

  const onMuteChanged = useCallback((muted: boolean) => {
    videos.current.forEach(video => {
      if (muted) video?.mute(false);
      else video?.unmute(false);
    });
  }, []);

  return (
    <>
      <div className={styles.wrapper} ref={ref}>
        <PostFeedHeader
          webCard={webCard}
          postsCount={postsCount}
          media={media}
          onClose={onClose}
          background={background}
        />
        <div className={styles.posts}>
          {posts.map((post, i) => (
            <PostFeedItem
              ref={e => {
                videos.current[i] = e;
              }}
              key={`${post.id}-${i}`}
              media={media}
              webCard={webCard}
              post={post}
              onDownload={() => download.current?.open()}
              onPlay={() => onVideoPlay(i)}
              onMuteChanged={muted => onMuteChanged(muted)}
              onPressAuthor={props.onPressAuthor}
            />
          ))}
        </div>
      </div>
      <DownloadAppModal ref={download} webCard={webCard} media={media} />
      {webCard.userName && (
        <ShareModal
          ref={share}
          link={generateShareProfileLink(webCard.userName)}
        />
      )}
    </>
  );
};

const COUNT_POSTS_TO_FETCH = 5;

export default PostFeed;
