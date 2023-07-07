import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { MediaImageRenderer } from '#components/medias';
import type { ViewProps } from 'react-native';

export type CoverForegroundPreviewProps = Omit<ViewProps, 'children'> & {
  foregroundId: string;
  /**
   * the foreground image uri
   */
  foregroundImageUri: string;
  /**
   * The tint color of the foreground image
   */
  foregroundImageTintColor?: string | null;
  /**
   * the height of the cover
   */
  height: number;
};

export type CoverForegroundPreviewHandle = {
  capture: () => Promise<string | null>;
};

const CoverForegroundPreview = ({
  height,
  foregroundId,
  foregroundImageTintColor,
  foregroundImageUri,
}: CoverForegroundPreviewProps) => {
  return (
    <MediaImageRenderer
      testID="cover-foreground-preview"
      source={{
        uri: foregroundImageUri,
        mediaId: foregroundId,
        requestedSize: height * COVER_RATIO,
      }}
      tintColor={foregroundImageTintColor}
      aspectRatio={COVER_RATIO}
      style={{ position: 'absolute', width: '100%', height: '100%' }}
      alt={'Cover edition foreground'}
    />
  );
};

export default CoverForegroundPreview;
