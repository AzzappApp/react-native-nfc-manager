import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import useRichTextManager from '#components/cardModules/tool/useRichTextManager';
import { getAuthState } from '#helpers/authStore';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import BottomSheetTextEditor from '#ui/BottomSheetTextEditor';
import Button from '#ui/Button';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import Text from '#ui/Text';
import type { ContactType } from '#helpers/contactTypes';
import type { NoteModalMutation } from '#relayArtifacts/NoteModalMutation.graphql';

type NoteModalProps = {
  contact: ContactType;
  visible: boolean;
  onDismiss: () => void;
};

const NoteModal = ({ contact, visible, onDismiss }: NoteModalProps) => {
  const intl = useIntl();
  const { top: topInset } = useScreenInsets();
  const [text, setText] = useState(contact.note);

  const [commit, loading] = useMutation<NoteModalMutation>(graphql`
    mutation NoteModalMutation(
      $profileId: ID!
      $contactId: ID!
      $contact: ContactInput!
    ) {
      saveContact(
        profileId: $profileId
        contactId: $contactId
        input: $contact
      ) {
        id
        note
      }
    }
  `);

  const onSave = useCallback(() => {
    const profileId = getAuthState().profileInfos?.profileId;
    if (profileId && contact.id) {
      commit({
        variables: {
          profileId,
          contactId: contact.id,
          contact: {
            note: text || '',
          },
        },
        onCompleted: () => {
          onDismiss();
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'Oops, modify note is not possible. Please try again later.',
              description: 'Error toast message when update contact note',
            }),
          });
        },
      });
    }
  }, [commit, contact, intl, onDismiss, text]);

  const { onSelectionChange, onChangeText, textAndSelection } =
    useRichTextManager({
      id: `text`,
      defaultValue: contact.note || '',
      setText,
    });

  useEffect(() => {
    onChangeText(contact.note || '');
  }, [contact.note, onChangeText]);

  return (
    <BottomSheetModal
      onDismiss={onDismiss}
      visible={visible}
      snapPoints={['100%']}
      handleComponent={null}
      keyboardBehavior="interactive"
    >
      <Header
        middleElement={formatDisplayName(
          contact.firstName,
          contact.lastName,
          contact.company,
        )}
        style={[styles.header, { marginTop: topInset }]}
        rightElement={
          <Button
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'NoteModal - Save header button label',
            })}
            disabled={contact.note === text}
            loading={loading}
          />
        }
        leftElement={
          <Button
            variant="secondary"
            onPress={onDismiss}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'NoteModal - Cancel header button label',
            })}
          />
        }
      />
      <View style={styles.container}>
        <Text variant="button" style={styles.title}>
          <FormattedMessage
            defaultMessage="Your note"
            description="NoteModal - Title"
          />
        </Text>
        <BottomSheetTextEditor
          multiline
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter your note',
            description: 'NoteModal - Text note placeholder',
          })}
          style={styles.textStyle}
          onChangeText={onChangeText}
          onSelectionChange={onSelectionChange}
          textAndSelection={textAndSelection}
        />
      </View>
    </BottomSheetModal>
  );
};

export default NoteModal;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    overflow: 'visible',
    flex: 1,
  },
  header: { zIndex: 300, height: HEADER_HEIGHT + 15 },
  title: {
    paddingTop: 10,
    paddingBottom: 5,
    textAlign: 'center',
  },
  textStyle: {
    borderWidth: 0,
    flex: 1,
    verticalAlign: 'top',
    paddingTop: 10,
  },
});
