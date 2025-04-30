import capitalize from 'lodash/capitalize';
import { notFound, redirect } from 'next/navigation';
import { getCldOgImageUrl } from 'next-cloudinary';
import {
  getMediasByIds,
  getPostByIdWithMedia,
  getPostCommentsWithWebCard,
  getWebCardById,
  getWebCardsPostsWithMedias,
} from '@azzapp/data';
import { DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL } from '@azzapp/shared/imagesHelpers';
import { getMetaData } from '#helpers/seo';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideoPlayer from '#ui/CloudinaryVideoPlayer';
import PostFeedHeader from '../../PostFeed/PostFeedHeader';
import CommentFeed from './CommentFeed';
import CommentFeedSeeMore from './CommentFeedSeeMore';
import styles from './PostPage.css';
import type { SocialMetas } from '#helpers/seo';
import type { Metadata } from 'next';

type PostPageProps = {
  params: Promise<{
    userName: string;
    postId: string;
  }>;
};

const PostPage = async (props: PostPageProps) => {
  const { userName, postId } = await props.params;

  const post = await getPostByIdWithMedia(postId);

  if (post?.deleted) {
    return notFound();
  }

  const author = post ? await getWebCardById(post.webCardId) : null;

  if (userName !== author?.userName) {
    return redirect(`/${author?.userName}/post/${post?.id}`);
  }

  const seeMorePosts =
    author && post
      ? await getWebCardsPostsWithMedias(author.id, 3, post.id)
      : [];
  const comments = post?.allowComments
    ? await getPostCommentsWithWebCard(post.id, 5)
    : [];

  const [media] = author?.coverMediaId
    ? await getMediasByIds([author.coverMediaId])
    : [];

  if (post && author && author.userName !== userName) {
    redirect(`/${author.userName}/post/${post.id}`);
  }

  if (!author || !post || !media || !author.cardIsPublished) return notFound();

  const [postMedia] = post.medias;

  return (
    <div className={styles.background}>
      <div className={styles.postFeedHeader}>
        <PostFeedHeader
          webCard={author}
          postsCount={author.nbPosts}
          media={media}
        />
      </div>
      <div className={styles.center}>
        <main className={styles.wrapper}>
          <div className={styles.postSection}>
            <div className={styles.postMedia}>
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
                      maxHeight: '100%',
                    }}
                    mutable
                  />
                </>
              ) : (
                <CloudinaryImage
                  mediaId={postMedia.id}
                  alt="post"
                  fill
                  sizes="100vw"
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
          postId={postId}
        />
      </aside>
    </div>
  );
};

export async function generateMetadata(
  props: PostPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const post = await getPostByIdWithMedia(params.postId);

  const metaData = {
    url: `${params.userName}/${params.postId}`,
    title: `${capitalize(params.userName)} Post`,
    description: `Post for Azzapp WebCard ${params.userName} `,
  } as SocialMetas;

  if (post?.medias && post.medias.length > 0) {
    metaData.ogImage = getCldOgImageUrl({
      src: post.medias[0].id,
      rawTransformations: [`so_${DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL}p`],
    });
  }
  return getMetaData(metaData);
}

export default PostPage;

export const dynamic = 'force-static';

export const generateStaticParams = () => [];

export const dynamicParams = true;
