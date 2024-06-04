import { useIntl } from 'react-intl';
import useToggle from '#hooks/useToggle';
import { useCoverEditorContext } from '../../CoverEditorContext';
import CoverEditorLinksModal from '../../CoverEditorToolbox/modals/CoverEditorLinksModal';
import ToolBoxSection from '../ui/ToolBoxSection';

const CoverEditorLinksTool = () => {
  const intl = useIntl();

  const [linksModalVisible, toggleLinksModalVisible] = useToggle();
  const {
    coverEditorState: { linksLayer },
  } = useCoverEditorContext();

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage(
          {
            defaultMessage: '{links} links',
            description: 'Cover Edition - Toolbox sub-menu links - Links',
          },
          { links: linksLayer.links.length },
        )}
        icon={`link`}
        onPress={toggleLinksModalVisible}
      />

      <CoverEditorLinksModal
        open={linksModalVisible}
        onClose={toggleLinksModalVisible}
      />
    </>
  );
};

export default CoverEditorLinksTool;
