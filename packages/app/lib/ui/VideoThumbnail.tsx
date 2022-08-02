import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import type { ImageProps } from 'react-native';

const VideoThumbnail = ({
  uri,
  ...props
}: Omit<ImageProps, 'source'> & { uri?: string; source?: string }) => {
  const [thumbnailSource, setThumbnailSource] = useState<string | null>(null);
  useEffect(() => {
    if (!uri) {
      return;
    }
    /// TODO cache system and Cloudinary system
    createThumbnail({
      url: uri,
      timeStamp: 0,
    })
      .then(response => {
        setThumbnailSource(response.path);
      })
      .catch(err => console.log({ err }));
  }, [uri]);

  const source = (thumbnailSource ? { uri: thumbnailSource } : null) as any;

  return <Image {...props} source={source} />;
};

export default VideoThumbnail;
