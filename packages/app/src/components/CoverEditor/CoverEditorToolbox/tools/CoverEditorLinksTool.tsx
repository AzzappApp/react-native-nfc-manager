import { forwardRef, useImperativeHandle } from 'react';
import { useIntl } from 'react-intl';
import useBoolean from '#hooks/useBoolean';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';
import { useCoverEditorContext } from '../../CoverEditorContext';
import CoverEditorLinksModal from '../../CoverEditorToolbox/modals/CoverEditorLinksModal';
import type { ForwardedRef } from 'react';

export type CoverEditorLinksToolActions = {
  openLinksModal: () => void;
};

const CoverEditorLinksTool = (
  _: any,
  ref: ForwardedRef<CoverEditorLinksToolActions>,
) => {
  const intl = useIntl();

  const [linksModalVisible, openLinksModalVisible, closeLinksModalVisible] =
    useBoolean(false);
  const { linksLayer } = useCoverEditorContext();

  useImperativeHandle(ref, () => ({
    openLinksModal: openLinksModalVisible,
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
        onPress={openLinksModalVisible}
      />

      <CoverEditorLinksModal
        visible={linksModalVisible}
        onClose={closeLinksModalVisible}
      />
    </>
  );
};

export default forwardRef(CoverEditorLinksTool);
