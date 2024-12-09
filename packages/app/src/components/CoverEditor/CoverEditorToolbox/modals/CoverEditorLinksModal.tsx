import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { isDefined } from '@azzapp/shared/isDefined';
import { colors } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import {
  useCoverEditorContext,
  useCoverEditorEditContext,
} from '#components/CoverEditor/CoverEditorContext';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useBoolean from '#hooks/useBoolean';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import { SocialLinksAddOrEditModal } from '#screens/SocialLinksEditionScreen/SocialLinksAddOrEditModal';
import SocialLinksLinksEditionPanel from '#screens/SocialLinksEditionScreen/SocialLinksLinksEditionPanel';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Text from '#ui/Text';
import type { SocialLinkItem } from '@azzapp/shared/socialLinkHelpers';

type CoverEditorLinksModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CoverEditorLinksModal = ({
  visible,
  onClose,
}: CoverEditorLinksModalProps) => {
  const { linksLayer } = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();
  const [links, setLinks] = useState<SocialLinkItem[]>(
    linksLayer.links.filter(isDefined),
  );

  const shownLinks = useMemo(() => {
    return links.sort((a, b) => a.position - b.position).slice(0, 4);
  }, [links]);
  const [addLinkVisible, openAddLink, closeAddLink] = useBoolean(false);

  const onDone = useCallback(() => {
    dispatch({
      type: 'UPDATE_LINKS',
      payload: shownLinks,
    });
    closeAddLink();
    onClose();
  }, [closeAddLink, dispatch, onClose, shownLinks]);

  const [pickedItem, setPickedItem] = useState<SocialLinkItem>();

  const onCloseAddLink = () => {
    setPickedItem(undefined);
    closeAddLink();
  };

  const onLinksChange = useCallback((socialLinks: SocialLinkItem[]) => {
    setLinks(socialLinks);
  }, []);

  const styles = useStyleSheet(styleSheet);
  const { height: screenHeight } = useScreenDimensions();

  const onDeleteLink = useCallback(
    (item: SocialLinkItem) => {
      onLinksChange(links.filter(l => l?.position !== item.position));
    },
    [links, onLinksChange],
  );

  const onLinkItemPress = useCallback(
    (link: SocialLinkItem) => {
      openAddLink();
      setPickedItem(link);
    },
    [openAddLink],
  );

  useEffect(() => {
    // allow to select the list of link when opeing the pannel for the first time
    if (visible && links.length === 0) {
      openAddLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onDismiss = () => {
    // reset local links on dismiss
    setLinks(linksLayer.links.filter(isDefined));
    onClose();
  };

  const { bottom } = useScreenInsets();

  return (
    <>
      <BottomSheetModal
        visible={visible}
        onDismiss={onDismiss}
        height={292 + bottom}
      >
        <Container style={styles.container}>
          <Header
            middleElement={
              <Text variant="large" style={styles.headerTitle}>
                <FormattedMessage
                  defaultMessage="Add links"
                  description="CoverEditorLinksModal - Header"
                />
              </Text>
            }
            rightElement={<DoneHeaderButton onPress={onDone} />}
          />
          <SocialLinksLinksEditionPanel
            ignoreKeyboard
            links={links}
            onDeleteLink={onDeleteLink}
            onItemPress={onLinkItemPress}
            onAddLink={openAddLink}
            maxLink={4}
          />
        </Container>
      </BottomSheetModal>
      <Suspense>
        <BottomSheetModal
          onDismiss={onCloseAddLink}
          visible={addLinkVisible}
          enableContentPanningGesture={false}
          height={screenHeight}
          showHandleIndicator={false}
        >
          <SocialLinksAddOrEditModal
            links={links}
            pickedItem={pickedItem}
            setPickedItem={setPickedItem}
            closeAddLink={closeAddLink}
            onLinksChange={onLinksChange}
          />
        </BottomSheetModal>
      </Suspense>
    </>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    height: 900,
  },
  headerTitle: {
    maxWidth: '50%',
    textAlign: 'center',
  },
  linksPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  links: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: appearance === 'light' ? colors.black : colors.white,
    height: 50,
    width: 50,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linksPreviewIcon: {
    width: 30,
    height: 30,
  },
  linksEditor: {
    flex: 1,
  },
}));

export default CoverEditorLinksModal;
