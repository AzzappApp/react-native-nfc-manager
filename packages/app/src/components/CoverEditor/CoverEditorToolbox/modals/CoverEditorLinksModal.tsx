import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  SOCIAL_LINKS,
  type SocialLinkId,
} from '@azzapp/shared/socialLinkHelpers';
import { colors } from '#theme';
import {
  CancelHeaderButton,
  DoneHeaderButton,
} from '#components/commonsButtons';
import {
  useCoverEditorContext,
  useCoverEditorEditContext,
} from '#components/CoverEditor/CoverEditorContext';
import { ScreenModal } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import SocialLinksLinksEditionPanel, {
  SOCIAL_LINK_PANEL_ITEM_HEIGHT,
} from '#screens/SocialLinksEditionScreen/SocialLinksLinksEditionPanel';
import Container from '#ui/Container';
import Header from '#ui/Header';
import { SocialIcon } from '#ui/Icon';
import Text from '#ui/Text';

type SocialLink = {
  link: string;
  position: number;
  socialId: string;
};

type CoverEditorLinksModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CoverEditorLinksModal = ({
  visible,
  onClose,
}: CoverEditorLinksModalProps) => {
  const cover = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();
  const [links, setLinks] = useState<Array<SocialLink | null>>(
    cover.linksLayer.links,
  );
  const inset = useScreenInsets();

  const shownLinks = useMemo(() => {
    return convertToNonNullArray(links)
      .sort((a, b) => a.position - b.position)
      .slice(0, 4);
  }, [links]);

  const onDone = useCallback(() => {
    dispatch({
      type: 'UPDATE_LINKS',
      payload: shownLinks,
    });
    onClose();
  }, [dispatch, onClose, shownLinks]);

  useEffect(() => {
    setLinks(cover.linksLayer.links);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const styles = useStyleSheet(styleSheet);
  return (
    <ScreenModal
      visible={visible}
      animationType="slide"
      onRequestDismiss={onClose}
    >
      <Container style={styles.container}>
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          <Header
            middleElement={
              <Text variant="large" style={styles.headerTitle}>
                <FormattedMessage
                  defaultMessage="Add links"
                  description="CoverEditorLinksModal - Header"
                />
              </Text>
            }
            leftElement={<CancelHeaderButton onPress={onClose} />}
            rightElement={<DoneHeaderButton onPress={onDone} />}
            style={{ marginTop: inset.top }}
          />
          <View style={styles.linksPreviewSection}>
            <View style={styles.linksPreviewContainer}>
              {shownLinks.map(link => (
                <View key={link.socialId} style={styles.links}>
                  <SocialIcon
                    style={styles.linksPreviewIcon}
                    icon={link.socialId as SocialLinkId}
                  />
                </View>
              ))}
            </View>
            {shownLinks.length > 0 && (
              <Text variant="medium" style={styles.linksPreviewCount}>
                <FormattedMessage
                  defaultMessage={'{links}/4 links'}
                  description="CoverEditorLinksModal - Links count"
                  values={{ links: shownLinks.length }}
                />
              </Text>
            )}
          </View>
          <SocialLinksLinksEditionPanel
            ignoreKeyboard
            links={links}
            onLinksChange={setLinks}
            style={styles.linksEditor}
            contentContainerStyle={{
              height:
                SOCIAL_LINK_PANEL_ITEM_HEIGHT * SOCIAL_LINKS.length +
                inset.bottom,
            }}
          />
        </KeyboardAvoidingView>
      </Container>
    </ScreenModal>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
  },
  headerTitle: {
    maxWidth: '50%',
    textAlign: 'center',
  },
  linksPreviewSection: {
    height: 120,
    justifyContent: 'center',
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
  linksPreviewCount: {
    textAlign: 'center',
    marginTop: 15,
    color: appearance === 'light' ? colors.grey400 : colors.grey600,
  },
  linksEditor: {
    flex: 1,
  },
}));

export default CoverEditorLinksModal;
