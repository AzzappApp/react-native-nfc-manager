import { useIntl } from 'react-intl';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';

type CardModuleMediaPickerProps = {
  mediaCount: number;
  open: () => void;
};

const CardModuleMediaPickerTool = ({
  mediaCount,
  open,
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
          { mediaCount },
        )}
        icon="multi_media"
        onPress={open}
      />
    </>
  );
};

export default CardModuleMediaPickerTool;
