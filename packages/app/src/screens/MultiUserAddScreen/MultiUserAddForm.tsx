import { parsePhoneNumber } from 'libphonenumber-js';
import { useCallback, type ReactNode } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import EmailOrPhoneInput from '#components/EmailOrPhoneInput';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import PressableOpacity from '#ui/PressableOpacity';
import Select from '#ui/Select';
import SelectList from '#ui/SelectList';
import Text from '#ui/Text';
import type { ProfileRole } from '#relayArtifacts/MultiUserScreenQuery.graphql';
import type { ContactCardEditFormValues } from '#screens/ContactCardEditScreen/ContactCardEditModalSchema';
import type { SelectListItemInfo } from '#ui/SelectList';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { CountryCode } from 'libphonenumber-js';
import type { Control } from 'react-hook-form';

export type MultiUserAddFormValues = ContactCardEditFormValues & {
  selectedContact: {
    countryCodeOrEmail: CountryCode | 'email';
    value: string;
  };
  role: ProfileRole;
  contactCard: ContactCard;
};

type MultiUserAddFormProps = {
  contacts: Array<{
    id: string;
    label: string;
    countryCodeOrEmail: CountryCode | 'email';
  }>;
  control: Control<MultiUserAddFormValues>;
};

const MultiUserAddForm = ({ contacts, control }: MultiUserAddFormProps) => {
  const styles = useStyleSheet(styleSheet);
  const [showAvailableInfo, toggleShowAvailableInfo] = useToggle(false);

  const { field } = useController({ control, name: 'role' });
  const intl = useIntl();
  const {
    field: fieldContact,
    fieldState: { error },
  } = useController({
    control,
    name: 'selectedContact',
  });
  const { value: selectedContact, onChange: setSelectedContact } = fieldContact;

  const updateSelectedContact = useCallback(
    (info: {
      id: string;
      label: string;
      countryCodeOrEmail: CountryCode | 'email';
    }) => {
      if (info.countryCodeOrEmail === 'email') {
        setSelectedContact({
          countryCodeOrEmail: 'email',
          value: info.id,
        });
        toggleShowAvailableInfo();

        return;
      }
      const parsed = parsePhoneNumber(info.id);
      setSelectedContact({
        countryCodeOrEmail: parsed.country,
        value: parsed.nationalNumber,
      });
      toggleShowAvailableInfo();
    },
    [setSelectedContact, toggleShowAvailableInfo],
  );

  const renderAvailableInfo = (
    itemInfo: SelectListItemInfo<{
      id: string;
      label: string;
    }>,
  ) => {
    return (
      <Text variant="button" style={styles.inputText}>
        {itemInfo.item.id}
      </Text>
    );
  };

  return (
    <View style={styles.form}>
      <>
        <View style={styles.emailAdressContainer}>
          <Text variant="xsmall" style={styles.selectTitle}>
            <FormattedMessage
              defaultMessage="Enter an Email address or a phone number"
              description="MultiUserAddModal - Title for manual contact select input"
            />
          </Text>
          {contacts?.length > 0 && (
            <PressableOpacity
              onPress={toggleShowAvailableInfo}
              hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
            >
              <Text variant="xsmall" style={styles.info}>
                <FormattedMessage
                  defaultMessage="See available Info"
                  description="MultiUserAddForm - See available info text link"
                />
              </Text>
            </PressableOpacity>
          )}
        </View>
        {contacts?.length > 0 && (
          <BottomSheetModal
            visible={showAvailableInfo}
            height={
              BOTTOM_SHEET_HEIGHT_BASE +
              contacts.length * BOTTOM_SHEET_HEIGHT_ITEM
            }
            variant="modal"
            contentContainerStyle={styles.bottomSheetContentContainer}
            onRequestClose={toggleShowAvailableInfo}
            nestedScroll
            headerTitle={
              intl.formatMessage({
                defaultMessage: 'Available Info',
                description:
                  'MultiUserAddForm - Available Info BottomSheet - Title',
              }) as string
            }
          >
            <SelectList
              data={contacts}
              keyExtractor={contact => contact.id}
              renderItem={renderAvailableInfo}
              onItemSelected={updateSelectedContact}
              itemContainerStyle={styles.selectItemContainerStyle}
            />
          </BottomSheetModal>
        )}
        <EmailOrPhoneInput
          input={
            selectedContact || {
              countryCodeOrEmail: 'email',
              value: '',
            }
          }
          onChange={setSelectedContact}
          hasError={error != null}
        />
        <Text style={styles.error} variant="error">
          {error != null && (
            <FormattedMessage
              defaultMessage="Please enter a valid phone number or email address."
              description="MultiUserAddForm - Error message when phone number or email address is wrong"
            />
          )}
        </Text>
      </>

      <Text variant="xsmall" style={[styles.selectTitle, { marginTop: 10 }]}>
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
            itemContainerStyle={[styles.selectItemContainerStyle]}
            bottomSheetHeight={
              BOTTOM_SHEET_HEIGHT_BASE + roles.length * BOTTOM_SHEET_HEIGHT_ITEM
            }
            bottomSheetTitle={
              intl.formatMessage({
                defaultMessage: 'Select a role',
                description: 'MultiUserAddForm - Role BottomSheet - Title',
              }) as string
            }
          />
        )}
      />
      <Text variant="xsmall" style={styles.description}>
        {field.value === 'user' && (
          <FormattedMessage
            defaultMessage="A user has a ContactCard{azzappA} linked to the shared webcard but cannot publish posts or edit the WebCard{azzappA}."
            description="MultiUserDetailModal - User description"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        )}
        {field.value === 'editor' && (
          <FormattedMessage
            defaultMessage="An editor can create and publish posts, edit the WebCard{azzappA}, but they cannot manage other aspects of the WebCard{azzappA}, such as settings and permissions."
            description="MultiUserDetailModal - Editor description"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        )}
        {field.value === 'admin' && (
          <FormattedMessage
            defaultMessage="The admin has full control over the WebCard{azzappA}, including the ability to add and remove collaborators. "
            description="MultiUserDetailModal - admin description"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        )}
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

const styleSheet = createStyleSheet(appearance => ({
  form: {
    paddingHorizontal: 10,
    marginTop: 20,
  },
  selectItemContainerStyle: {
    paddingHorizontal: 30,
    marginBottom: 18,
  },
  selectTitle: {
    paddingBottom: 10,
  },
  description: {
    textAlign: 'center',
    marginTop: 20,
    color: appearance === 'light' ? colors.grey900 : colors.grey300,
  },
  bottomSheetContentContainer: {
    paddingHorizontal: 0,
    marginHorizontal: 0,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  inputText: {
    color: appearance === 'light' ? colors.black : colors.white,
    height: 30,
  },
  emailAdressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  error: {
    minHeight: 15,
    marginBottom: 5,
  },
  info: {
    textDecorationLine: 'underline',
  },
}));

const BOTTOM_SHEET_HEIGHT_BASE = 100;
const BOTTOM_SHEET_HEIGHT_ITEM = 40;

export default MultiUserAddForm;
