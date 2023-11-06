import { Controller } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { colors, textStyles } from '#theme';
import Select from '#ui/Select';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { ContactCardEditFormValues } from '#screens/ContactCardScreen/ContactCardEditModalSchema';
import type { ProfileRole } from '@azzapp/relay/artifacts/MultiUserScreenQuery.graphql';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

export type MultiUserAddFormValues = ContactCardEditFormValues & {
  contact: string;
  manualContact: string;
  role: ProfileRole;
  contactCard: ContactCard;
};

type MultiUserAddFormProps = {
  contacts: Array<{ id: string; label: string }>;
  currentContact: string;
  control: Control<MultiUserAddFormValues>;
};

const MultiUserAddForm = (props: MultiUserAddFormProps) => {
  const { contacts, currentContact, control } = props;

  return (
    <View style={styles.form}>
      <Text style={[styles.selectTitle, textStyles.xsmall]}>
        <FormattedMessage
          defaultMessage="Invitation Email address or phone number"
          description="MultiUserAddModal - Title for contact select input"
        />
      </Text>
      <Controller
        control={control}
        name="contact"
        render={({ field: { onChange, value } }) => (
          <Select
            nativeID="contact"
            accessibilityLabelledBy="contactLabel"
            data={contacts}
            selectedItemKey={value}
            keyExtractor={contact => contact.id}
            onItemSelected={item => onChange(item.id)}
            itemContainerStyle={styles.selectItemContainerStyle}
            bottomSheetHeight={
              BOTTOM_SHEET_HEIGHT_BASE +
              contacts.length * BOTTOM_SHEET_HEIGHT_ITEM
            }
          />
        )}
      />
      {currentContact === 'manual' && (
        <>
          <Text
            style={[styles.selectTitle, textStyles.xsmall, { marginTop: 10 }]}
          >
            <FormattedMessage
              defaultMessage="Enter an Email address or a phone number"
              description="MultiUserAddModal - Title for manual contact select input"
            />
          </Text>
          <Controller
            control={control}
            name="manualContact"
            render={({ field: { onChange, value } }) => (
              <TextInput
                nativeID="manualContact"
                accessibilityLabelledBy="manualContactLabel"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            )}
          />
        </>
      )}
      <Text style={[styles.selectTitle, textStyles.xsmall, { marginTop: 10 }]}>
        <FormattedMessage
          defaultMessage="Role"
          description="MultiUserAddModal - Title for role select input"
        />
      </Text>
      <Controller
        control={control}
        name="role"
        render={({ field: { onChange, value } }) => (
          <Select
            nativeID="role"
            accessibilityLabelledBy="roleLabel"
            data={roles}
            selectedItemKey={value}
            keyExtractor={role => role.id}
            onItemSelected={item => onChange(item.id)}
            itemContainerStyle={styles.selectItemContainerStyle}
            bottomSheetHeight={
              BOTTOM_SHEET_HEIGHT_BASE + roles.length * BOTTOM_SHEET_HEIGHT_ITEM
            }
          />
        )}
      />
      <Text style={styles.avatarLabel}>
        <FormattedMessage
          defaultMessage="A user has a ContactCard linked to the shared webcard but cannot publish posts or edit the WebCard."
          description="MultiUserAddModal - Contact Card section"
        />
      </Text>
    </View>
  );
};

const roles: Array<{ id: ProfileRole; label: ReactNode }> = [
  {
    id: 'user',
    label: (
      <FormattedMessage
        defaultMessage="User"
        description="MultiUserAddModal - Label for user select input"
      />
    ),
  },
  {
    id: 'editor',
    label: (
      <FormattedMessage
        defaultMessage="Editor"
        description="MultiUserAddModal - Label for editor select input"
      />
    ),
  },
  {
    id: 'admin',
    label: (
      <FormattedMessage
        defaultMessage="Admin"
        description="MultiUserAddModal - Label for admin select input"
      />
    ),
  },
];

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: 10,
    marginTop: 20,
  },
  selectItemContainerStyle: {
    paddingHorizontal: 30,
  },
  selectTitle: {
    color: colors.grey900,
    paddingBottom: 10,
  },
  avatarLabel: {
    marginTop: 20,
    textAlign: 'center',
  },
});

const BOTTOM_SHEET_HEIGHT_BASE = 20;
const BOTTOM_SHEET_HEIGHT_ITEM = 30;

export default MultiUserAddForm;
