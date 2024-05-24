import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors } from '#theme';
import { CoverEditorActionType } from '#components/CoverEditor/coverEditorActions';
import { useCoverEditorContext } from '#components/CoverEditor/CoverEditorContext';
import ScreenModal from '#components/ScreenModal';
import SocialLinksLinksEditionPanel from '#screens/SocialLinksEditionScreen/SocialLinksLinksEditionPanel';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import { SocialIcon } from '#ui/Icon';
import Text from '#ui/Text';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';

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
  const { cover, dispatch } = useCoverEditorContext();
  const [links, setLinks] = useState<Array<SocialLink | null>>(
    cover.linksLayer.links,
  );
  const intl = useIntl();

  const shownLinks = useMemo(() => {
    return convertToNonNullArray(links)
      .sort((a, b) => a.position - b.position)
      .slice(0, 4);
  }, [links]);

  const onDone = useCallback(() => {
    dispatch({
      type: CoverEditorActionType.UpdateLinks,
      payload: shownLinks,
    });
    onClose();
  }, [dispatch, onClose, shownLinks]);

  useEffect(() => {
    setLinks(cover.linksLayer.links);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <ScreenModal visible={open} animationType="slide">
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
          <SocialLinksLinksEditionPanel
            links={links}
            onLinksChange={setLinks}
            style={{
              flex: 1,
            }}
          />
        </SafeAreaView>
      </Container>
    </ScreenModal>
  );
};

export const BOTTOM_MENU_HEIGHT = 70;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    maxWidth: '50%',
    textAlign: 'center',
  },
  // styleItem: {
  //   flex: 0.5,
  // },
  // styleItemContent: {
  //   height: 172,
  //   backgroundColor: colors.grey50,
  //   borderRadius: 12,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // tagsContainer: {
  //   width: '100%',
  //   height: 33,
  //   marginTop: 20,
  // },
  // tags: {
  //   gap: 10,
  //   flexDirection: 'row',
  //   paddingHorizontal: 20,
  // },
  // styleItemsContainer: {
  //   marginTop: 20,
  //   flex: 1,
  // },
  // styleItems: {
  //   gap: 10,
  //   paddingHorizontal: 10,
  //   paddingBottom: 50,
  // },
  // styleItemsColumn: {
  //   gap: 10,
  //   flex: 1,
  // },
});

export default CoverEditorLinksModal;
