import PhotoWithTextAndTitleRenderer from '#components/cardModules/PhotoWithTextAndTitleRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { PhotoWithTextAndTitleRendererProps } from '#components/cardModules/PhotoWithTextAndTitleRenderer';

type PhotoWithTextAndTitlePreviewProps = Pick<
  PhotoWithTextAndTitleRendererProps,
  'animatedData' | 'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the PhotoWithTextAndTitle module.
 */
const PhotoWithTextAndTitlePreview = ({
  data,
  colorPalette,
  cardStyle,
  onPreviewPress,
  ...props
}: PhotoWithTextAndTitlePreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <PhotoWithTextAndTitleRenderer
        colorPalette={colorPalette}
        cardStyle={cardStyle}
        data={data}
        animatedData={props.animatedData!}
      />
    </EditorScaledPreview>
  );
};

export default PhotoWithTextAndTitlePreview;
