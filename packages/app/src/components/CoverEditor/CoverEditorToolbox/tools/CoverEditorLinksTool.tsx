import { forwardRef, useImperativeHandle } from 'react';
import { useIntl } from 'react-intl';
import useToggle from '#hooks/useToggle';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';
import { useCoverEditorContext } from '../../CoverEditorContext';
import CoverEditorLinksModal from '../../CoverEditorToolbox/modals/CoverEditorLinksModal';
import type { ForwardedRef } from 'react';

export type CoverEditorLinksToolActions = {
  toggleLinksModal: () => void;
};

const CoverEditorLinksTool = (
  _: any,
  ref: ForwardedRef<CoverEditorLinksToolActions>,
) => {
  const intl = useIntl();

  const [linksModalVisible, toggleLinksModalVisible] = useToggle();
  const { linksLayer } = useCoverEditorContext();

  useImperativeHandle(ref, () => ({
    toggleLinksModal: toggleLinksModalVisible,
  }));

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
        icon="link"
        onPress={toggleLinksModalVisible}
      />

      <CoverEditorLinksModal
        visible={linksModalVisible}
        onClose={toggleLinksModalVisible}
      />
    </>
  );
};

export default forwardRef(CoverEditorLinksTool);
