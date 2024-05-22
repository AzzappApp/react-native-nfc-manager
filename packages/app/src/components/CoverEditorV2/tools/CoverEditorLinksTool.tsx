import { useIntl } from 'react-intl';
import useToggle from '#hooks/useToggle';
import ToolBoxSection from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorLinksModal from '../toolbox/modals/CoverEditorLinksModal';

const CoverEditorLinksTool = () => {
  const intl = useIntl();

  const [linksModalVisible, toggleLinksModalVisible] = useToggle();
  const { cover } = useCoverEditorContext();

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage(
          {
            defaultMessage: '{links} links',
            description: 'Cover Edition - Toolbox sub-menu links - Links',
          },
          { links: cover.linksLayer.links.length },
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
