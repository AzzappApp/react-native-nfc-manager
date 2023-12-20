import Link from 'next/link';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CommentFeedSeeMore.css';
import type { PostWithMedias, WebCard } from '@azzapp/data/domains';

type CommentFeedMoreMediaProps = {
  webCard: WebCard;
  post: PostWithMedias;
};

const CommentFeedMoreMedia = (props: CommentFeedMoreMediaProps) => {
  const { post, webCard } = props;

  const media = post.medias[0];

  return (
    <Link
      href={`/${webCard.userName}/${post.id}`}
      className={styles.media}
      style={{
        aspectRatio: `${media.width / media.height}`,
      }}
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
        />
      )}
    </Link>
  );
};

export default CommentFeedMoreMedia;
