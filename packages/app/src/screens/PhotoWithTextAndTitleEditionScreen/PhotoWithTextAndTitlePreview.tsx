import { useIntl } from 'react-intl';
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
  const intl = useIntl();
  const moduleData = {
    ...data,
    title:
      data.title ||
      intl.formatMessage({
        defaultMessage: 'Add section Title here',
        description: 'PhotoWithTextAndTitle default module title',
      }),
    content:
      data.content ||
      intl.formatMessage({
        defaultMessage:
          "Add section Text here. To edit this section, simply open the editor and start typing. You can change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match your webcard's design and branding.",
        description: 'PhotoWithTextAndTitle default module text',
      }),
  };
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <PhotoWithTextAndTitleRenderer
        colorPalette={colorPalette}
        cardStyle={cardStyle}
        data={moduleData}
        animatedData={props.animatedData}
      />
    </EditorScaledPreview>
  );
};

export default PhotoWithTextAndTitlePreview;
