import { unstable_cache } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  getMediasByIds,
  getPostByIdWithMedia,
  getPostCommentsWithWebCard,
  getWebCardById,
  getWebCardsPostsWithMedias,
} from '@azzapp/data/domains';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideoPlayer from '#ui/CloudinaryVideoPlayer';
import PostFeedHeader from '../PostFeed/PostFeedHeader';
import CommentFeed from './CommentFeed';
import CommentFeedSeeMore from './CommentFeedSeeMore';
import styles from './PostPage.css';
import type { Metadata } from 'next';

type PostPageProps = {
  params: {
    userName: string;
    postId: string;
  };
};

const PostPage = async (props: PostPageProps) => {
  const {
    params: { userName, postId },
  } = props;

  const { post, seeMorePosts, media, comments, author } = await unstable_cache(
    async () => {
      const post = await getPostByIdWithMedia(postId);
      const author = post ? await getWebCardById(post.webCardId) : null;
      const seeMorePosts =
        author && post
          ? await getWebCardsPostsWithMedias(author.id, 3, 0, post.id)
          : [];
      const comments = post?.allowComments
        ? await getPostCommentsWithWebCard(post.id, 5)
        : [];

      const [media] = author?.coverData?.mediaId
        ? await getMediasByIds([author.coverData.mediaId])
        : [];

      return {
        post,
        seeMorePosts,
        media,
        comments,
        author,
      };
    },
    [`post-${userName}-${postId}`],
    { tags: [`post-${userName}-${postId}`] },
  )();

  if (post && author && author.userName !== userName) {
    redirect(`/${author.userName}/${post.id}`);
  }

  if (!author || !post || !media || !author.cardIsPublished) return notFound();

  const [postMedia] = post.medias;

  return (
    <div className={styles.background}>
      <div className={styles.postFeedHeader}>
        <PostFeedHeader webCard={author} postsCount={0} media={media} />
      </div>
      <div className={styles.center}>
        <main className={styles.wrapper}>
          <div className={styles.postSection}>
            <div
              className={styles.postMedia}
              style={{ aspectRatio: `${postMedia.width / postMedia.height}` }}
            >
              {postMedia.kind === 'video' ? (
                <>
                  <CloudinaryVideoPlayer
                    assetKind="post"
                    media={postMedia}
                    alt="post"
                    fluid
                    style={{
                      objectFit: 'contain',
                      width: '100%',
                    }}
                  />
                </>
              ) : (
                <CloudinaryImage
                  mediaId={postMedia.id}
                  assetKind="post"
                  alt="post"
                  fill
                  style={{
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
          </div>
          <CommentFeed
            webCard={author}
            post={post}
            media={media}
            comments={comments}
          />
        </main>
      </div>
      <aside className={styles.center}>
        <CommentFeedSeeMore
          posts={seeMorePosts}
          media={media}
          webCard={author}
        />
      </aside>
    </div>
  );
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  return {
    title: params.userName,
  };
}

export default PostPage;

export const dynamic = 'force-static';
