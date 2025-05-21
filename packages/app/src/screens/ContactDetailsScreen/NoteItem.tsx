import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useBoolean from '#hooks/useBoolean';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import NoteModal from './NoteModal';
import type { NoteItem_contact$key } from '#relayArtifacts/NoteItem_contact.graphql';

const NoteItem = ({
  contact: contactKey,
}: {
  contact?: NoteItem_contact$key | null;
}) => {
  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);
  const [show, open, close] = useBoolean(false);

  const contact = useFragment(
    graphql`
      fragment NoteItem_contact on Contact {
        note
        ...NoteModal_contact
      }
    `,
    contactKey,
  );

  return (
    <>
      <PressableOpacity style={styles.noteItem} onPress={open}>
        <View style={styles.label}>
          <Icon icon="edit" />
          <Text variant="smallbold">
            {intl.formatMessage({
              defaultMessage: 'Note',
              description: 'ContactDetailsModal - Note input label',
            })}
          </Text>
        </View>
        {(contact?.note && (
          <Text style={styles.noteItemText}>{contact.note}</Text>
        )) || (
          <Text style={[styles.noteItemText, { color: colors.grey400 }]}>
            {intl.formatMessage({
              defaultMessage: 'Enter a note for this contact',
              description: 'ContactDetailsModal - Note text input placeholder',
            })}
          </Text>
        )}
      </PressableOpacity>
      <NoteModal contact={contact} visible={show} onDismiss={close} />
    </>
  );
};

export default NoteItem;

const stylesheet = createStyleSheet(appearance => ({
  noteItem: {
    width: '100%',
    ...shadow({ appearance, direction: 'center' }),
    marginTop: 15,
    padding: 14,
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.white,
    borderRadius: 12,
  },

  noteItemText: {
    marginTop: 5,
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.white,
    borderWidth: 0,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
}));
