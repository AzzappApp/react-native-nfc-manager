import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';

const CloudinaryImageField = ({
  id,
  height = 100,
}: {
  id: string;
  height?: number;
}) => {
  return (
    <img
      src={getImageURLForSize(id, undefined, height, 1)}
      style={{ height }}
    />
  );
};

export default CloudinaryImageField;
