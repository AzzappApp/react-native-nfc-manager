import { SocialLinksRendererRaw } from '#components/cardModules/SocialLinksRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { SocialLinksRawData } from '#components/cardModules/SocialLinksRenderer';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type SocialLinksPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: SocialLinksRawData;
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
  onPreviewPress,
  ...props
}: SocialLinksPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <SocialLinksRendererRaw data={data} />
    </EditorScaledPreview>
  );
};

export default SocialLinksPreview;
