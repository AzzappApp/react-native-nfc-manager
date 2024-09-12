import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CommentFeedSeeMore.css';
import type { PostWithMedias, WebCard } from '@azzapp/data';

type CommentFeedMoreMediaProps = {
  webCard: WebCard;
  post: PostWithMedias;
};

const CommentFeedMoreMedia = (props: CommentFeedMoreMediaProps) => {
  const { post, webCard } = props;

  const media = post.medias[0];

  const href = `/${webCard.userName}/post/${post.id}`;
  const router = useRouter();
  const onClick = useCallback(() => {
    router.push(href);
  }, [href, router]);

  return (
    <a
      href={href}
      className={styles.media}
      style={{
        aspectRatio: `${media.width / media.height}`,
      }}
      onClick={onClick}
    >
      {media.kind === 'video' ? (
        <>
          <CloudinaryVideo
            assetKind="cover"
            media={media}
            alt="cover"
            fluid
            style={{
              objectFit: 'cover',
              width: '100%',
            }}
            autoPlay={false}
          />
        </>
      ) : (
        <CloudinaryImage
          mediaId={media.id}
          alt="cover"
          fill
          sizes="100vw"
          style={{
            objectFit: 'cover',
          }}
          format="auto"
        />
      )}
    </a>
  );
};

export default CommentFeedMoreMedia;
