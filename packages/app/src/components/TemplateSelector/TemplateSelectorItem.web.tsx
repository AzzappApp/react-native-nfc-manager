import { useIntl } from 'react-intl';
import { Dimensions } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import PressableNative from '#ui/PressableNative';
import type { TemplateSelectorItem_templateData$key } from '@azzapp/relay/artifacts/TemplateSelectorItem_templateData.graphql';

type TemplateSelectorTemplateItemProps = {
  /**
   * the selected CoverTEmplate
   *
   * @type {TemplateCover}
   */
  template: TemplateSelectorItem_templateData$key;
  /**
   * the index of the flatlist item (for styling purpose)
   *
   * @type {number}
   */
  index: number;
  /**
   * the function to call when the user select a template
   *
   */
  selectTemplate: (templateId: string) => void;
};

const TemplateSelectorTemplateItem = ({
  index,
}: TemplateSelectorTemplateItemProps) => {
  const intl = useIntl();
  return (
    <PressableNative
      style={{
        width: ITEM_WIDTH,
        height: ITEM_WIDTH / COVER_RATIO,
        marginLeft: index === 0 ? 13.5 : 0,
        borderRadius: COVER_CARD_RADIUS * ITEM_WIDTH,
        overflow: 'hidden',
      }}
      accessibilityRole="link"
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'Select this cover template template for your profile',
        description:
          'TemplateSelectorTemplateItem accessibilityHint template item',
      })}
    />
  );
};

export default TemplateSelectorTemplateItem;

const RATIO_TEMPLATE = 7 / 15;
const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * RATIO_TEMPLATE;
