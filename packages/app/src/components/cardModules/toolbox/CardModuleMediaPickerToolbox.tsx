import { useIntl } from 'react-intl';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import { hasCardModuleMediasError } from '#helpers/cardModuleHelpers';
import type { ModuleKindAndVariant } from '#helpers/webcardModuleHelpers';
import type { CardModuleMedia } from '../cardModuleEditorType';

type CardModuleMediaPickerProps = {
  cardModuleMedias: CardModuleMedia[];
  module: ModuleKindAndVariant;
  open: () => void;
};

const CardModuleMediaPickerTool = ({
  cardModuleMedias,
  open,
  module,
}: CardModuleMediaPickerProps) => {
  const intl = useIntl();

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage(
          {
            defaultMessage: `{mediaCount, plural,
                  =0 { media}
                  =1 {# media}
                  other {# medias}}`,
            description: 'CardModuleMediaPickerTool - Toolboxton title',
          },
          { mediaCount: cardModuleMedias?.length ?? 0 },
        )}
        icon="multi_media"
        onPress={open}
        showError={hasCardModuleMediasError(cardModuleMedias, module)}
      />
    </>
  );
};

export default CardModuleMediaPickerTool;
