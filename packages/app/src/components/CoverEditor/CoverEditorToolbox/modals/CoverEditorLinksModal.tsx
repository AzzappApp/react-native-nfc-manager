import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  SOCIAL_LINKS,
  type SocialLinkId,
} from '@azzapp/shared/socialLinkHelpers';
import { colors } from '#theme';
import { useCoverEditorContext } from '#components/CoverEditor/CoverEditorContext';
import { ScreenModal } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import SocialLinksLinksEditionPanel, {
  SOCIAL_LINK_PANEL_ITEM_HEIGHT,
} from '#screens/SocialLinksEditionScreen/SocialLinksLinksEditionPanel';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import { SocialIcon } from '#ui/Icon';
import Text from '#ui/Text';

type SocialLink = {
  link: string;
  position: number;
  socialId: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const CoverEditorLinksModal = ({ open, onClose }: Props) => {
  const { coverEditorState: cover, dispatch } = useCoverEditorContext();
  const [links, setLinks] = useState<Array<SocialLink | null>>(
    cover.linksLayer.links,
  );
  const intl = useIntl();
  const inset = useScreenInsets();
  const [linksHeight, setLinksHeight] = useState(0);

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
  }, [open]);

  return (
    <ScreenModal
      visible={open}
      animationType="slide"
      onRequestDismiss={onClose}
    >
      {open && (
        <Container style={styles.container}>
          <SafeAreaView
            style={styles.container}
            edges={{ bottom: 'off', top: 'additive' }}
          >
            <Header
              middleElement={
                <Text variant="large" style={styles.header}>
                  <FormattedMessage
                    defaultMessage="Add links"
                    description="CoverEditorLinksModal - Header"
                  />
                </Text>
              }
              leftElement={
                <Button
                  variant="secondary"
                  label={intl.formatMessage({
                    defaultMessage: 'Cancel',
                    description: 'MultiUserAddModal - Cancel button label',
                  })}
                  onPress={onClose}
                />
              }
              rightElement={
                <Button
                  variant="primary"
                  label={intl.formatMessage({
                    defaultMessage: 'Done',
                    description: 'MultiUserAddModal - Cancel button label',
                  })}
                  onPress={onDone}
                />
              }
            />
            <View
              style={{
                height: 120,
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 15,
                }}
              >
                {shownLinks.map(link => (
                  <View
                    key={link.socialId}
                    style={{
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'black',
                      height: 50,
                      width: 50,
                      borderRadius: 40,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <SocialIcon
                      style={{
                        width: 30,
                        height: 30,
                      }}
                      icon={link.socialId as SocialLinkId}
                    />
                  </View>
                ))}
              </View>
              {shownLinks.length > 0 && (
                <Text
                  variant="medium"
                  style={{
                    textAlign: 'center',
                    marginTop: 15,
                    color: colors.grey400,
                  }}
                >
                  <FormattedMessage
                    defaultMessage={'{links}/4 links'}
                    description="CoverEditorLinksModal - Links count"
                    values={{ links: shownLinks.length }}
                  />
                </Text>
              )}
            </View>
            <KeyboardAvoidingView
              style={styles.previews}
              behavior="position"
              onLayout={e => setLinksHeight(e.nativeEvent.layout.height)}
            >
              <View>
                <SocialLinksLinksEditionPanel
                  links={links}
                  onLinksChange={setLinks}
                  style={{
                    flex: 1,
                    minHeight: linksHeight,
                  }}
                  contentContainerStyle={{
                    height:
                      SOCIAL_LINK_PANEL_ITEM_HEIGHT * SOCIAL_LINKS.length +
                      inset.bottom +
                      BOTTOM_MENU_HEIGHT,
                  }}
                />
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Container>
      )}
    </ScreenModal>
  );
};

const BOTTOM_MENU_HEIGHT = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    maxWidth: '50%',
    textAlign: 'center',
  },
  previews: {
    flex: 1,
    marginTop: 320,
  },
});

export default CoverEditorLinksModal;
