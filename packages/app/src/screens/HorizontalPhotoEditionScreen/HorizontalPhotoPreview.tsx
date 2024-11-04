import HorizontalPhotoRenderer from '#components/cardModules/HorizontalPhotoRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { HorizontalPhotoRendererProps } from '#components/cardModules/HorizontalPhotoRenderer';

type HorizontalPhotoPreviewProps = Pick<
  HorizontalPhotoRendererProps,
  'animatedData' | 'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the HorizontalPhoto module.
 */
const HorizontalPhotoPreview = ({
  data,
  colorPalette,
  cardStyle,
  onPreviewPress,
  animatedData,
  ...props
}: HorizontalPhotoPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <HorizontalPhotoRenderer
        data={data}
        colorPalette={colorPalette}
        cardStyle={cardStyle}
        animatedData={animatedData!}
      />
    </EditorScaledPreview>
  );
};

export default HorizontalPhotoPreview;
