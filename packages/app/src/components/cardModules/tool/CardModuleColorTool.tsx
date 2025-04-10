import { useIntl } from 'react-intl';
import { DoneHeaderButton } from '#components/commonsButtons';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import {
  getInitialDyptichColor,
  EMPTY_CARD_MODULE_COLOR,
  dyptichByModuleVariant,
} from '#helpers/cardModuleColorsHelpers';
import useBoolean from '#hooks/useBoolean';
import BottomSheetModal from '#ui/BottomSheetModal';
import Header from '#ui/Header';
import CardModuleColorDyptichTool from './CardModuleColorDyptichTool';
import type { ModuleKindAndVariant } from '#helpers/webcardModuleHelpers';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';

type CardModuleColorToolProps = {
  cardColors: {
    readonly dark: string;
    readonly light: string;
    readonly primary: string;
  };
  cardModuleColor: CardModuleColor;
  onModuleColorChange: (moduleColor: CardModuleColor) => void;
  module: ModuleKindAndVariant;
};

const CardModuleColorTool = ({
  cardColors,
  cardModuleColor,
  onModuleColorChange,
  module,
}: CardModuleColorToolProps) => {
  const intl = useIntl();
  const [show, open, close] = useBoolean(false);
  const variantColor = dyptichByModuleVariant(module);
  if (!isVisible(module) || !variantColor) {
    return null;
  }

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Color',
          description: 'Card Module Colors Tool - Toolbox Color',
        })}
        icon="color_variant"
        onPress={open}
      />
      <BottomSheetModal visible={show} onDismiss={close}>
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Color',
            description: 'Card Module Colors Tool -Bottom Sheet title',
          })}
          rightElement={<DoneHeaderButton onPress={close} />}
        />

        <CardModuleColorDyptichTool
          cardColors={cardColors}
          cardModuleColor={cardModuleColor}
          onModuleColorChange={onModuleColorChange}
          variantColor={variantColor}
        />
      </BottomSheetModal>
    </>
  );
};

export default CardModuleColorTool;

const isVisible = (module: ModuleKindAndVariant) => {
  return getInitialDyptichColor(module, 'light') !== EMPTY_CARD_MODULE_COLOR;
};
