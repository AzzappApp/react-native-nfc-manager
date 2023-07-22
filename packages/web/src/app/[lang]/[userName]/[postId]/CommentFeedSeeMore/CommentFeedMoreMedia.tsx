import Link from 'next/link';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './CommentFeedSeeMore.css';
import type { PostWithMedias, Profile } from '@azzapp/data/domains';

type CommentFeedMoreMediaProps = {
  profile: Profile;
  post: PostWithMedias;
};

const CommentFeedMoreMedia = (props: CommentFeedMoreMediaProps) => {
  const { post, profile } = props;

  const media = post.medias[0];

  return (
    <Link
      href={`/${profile.userName}/${post.id}`}
      className={styles.media}
      style={{
        aspectRatio: `${media.width / media.height}`,
      }}
    >
      <CloudinaryImage
        mediaId={media.id}
        alt="cover"
        fill
        style={{
          objectFit: 'cover',
        }}
      />
    </Link>
  );
};

export default CommentFeedMoreMedia;
