import SocialLinksRenderer from '#components/cardModules/SocialLinksRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { SocialLinksRendererProps } from '#components/cardModules/SocialLinksRenderer';

type SocialLinksPreviewProps = Pick<
  SocialLinksRendererProps,
  'animatedData' | 'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the SocialLinks module.
 */
const SocialLinksPreview = ({
  data,
  colorPalette,
  cardStyle,
  onPreviewPress,
  ...props
}: SocialLinksPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <SocialLinksRenderer
        colorPalette={colorPalette}
        cardStyle={cardStyle}
        data={data}
        animatedData={props.animatedData!}
        disabled
      />
    </EditorScaledPreview>
  );
};

export default SocialLinksPreview;
