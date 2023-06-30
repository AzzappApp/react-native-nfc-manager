import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useReducer } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment, useMutation } from 'react-relay';

import { colors } from '#theme';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactCardEditModalEmails from './ContactCardEditModalEmails';
import ContactCardEditModalPhones from './ContactCardEditModalPhones';
import { contactCardEditSchema } from './ContactCardEditModalSchema';
import ContactCardEditModalStyles, {
  DELETE_BUTTON_WIDTH,
} from './ContactCardEditModalStyles';
import type { ContactCardEditForm } from './ContactCardEditModalSchema';
import type { ContactCardEditModal_card$key } from '@azzapp/relay/artifacts/ContactCardEditModal_card.graphql';
import type { LayoutRectangle } from 'react-native';

const reducer = (
  state: { deleted: boolean; rect: LayoutRectangle | null },
  action:
    | {
        type: 'DELETE_FIELD';
      }
    | {
        type: 'OPEN_DELETION_OPTION';
        payload: LayoutRectangle | null;
      }
    | { type: 'CLOSE_DELETION_OPTION' },
) => {
  switch (action.type) {
    case 'DELETE_FIELD':
      return {
        ...state,
        deleted: true,
      };
    case 'OPEN_DELETION_OPTION':
      return {
        deleted: false,
        rect: action.payload,
      };
    case 'CLOSE_DELETION_OPTION':
      return {
        deleted: false,
        rect: null,
      };
  }
};

export type ContactCardEditModalProps = {
  visible: boolean;
  toggleBottomSheet: () => void;
  contactCard: ContactCardEditModal_card$key;
};

const ContactCardEditModal = ({
  visible,
  toggleBottomSheet,
  contactCard: contactCardKey,
}: ContactCardEditModalProps) => {
  const contactCard = useFragment(
    graphql`
      fragment ContactCardEditModal_card on ContactCard {
        id
        firstName
        lastName
        title
        company
        emails {
          label
          address
          selected
        }
        phoneNumbers {
          label
          number
          selected
        }
      }
    `,
    contactCardKey,
  );

  const intl = useIntl();

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const [commit] = useMutation(
    graphql`
      mutation ContactCardEditModalMutation($input: SaveContactCardInput!) {
        saveContactCard(input: $input) {
          contactCard {
            ...ContactCardEditModal_card
          }
        }
      }
    `,
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ContactCardEditForm>({
    mode: 'onBlur',
    resolver: zodResolver(contactCardEditSchema),
    defaultValues: {
      ...contactCard,
      emails: contactCard.emails?.map(m => ({ ...m })) ?? [],
      phoneNumbers: contactCard.phoneNumbers?.map(p => ({ ...p })) ?? [],
    },
  });

  const [state, dispatch] = useReducer(reducer, { rect: null, deleted: false });

  const openDeleteButton = useCallback((rect: LayoutRectangle | null) => {
    dispatch({ type: 'OPEN_DELETION_OPTION', payload: rect });
  }, []);

  const closeDeleteButton = useCallback(() => {
    dispatch({
      type: 'CLOSE_DELETION_OPTION',
    });
  }, []);

  const submit = handleSubmit(
    data => {
      commit({
        variables: {
          input: {
            ...data,
            emails: data.emails.filter(email => email.address),
            phoneNumbers: data.phoneNumbers.filter(
              phoneNumber => phoneNumber.number,
            ),
          },
        },
        onCompleted: () => {
          toggleBottomSheet();
        },
        onError: () => {
          toggleBottomSheet();
        },
      });
    },
    error => {
      console.log(error);
    },
  );

  return (
    <BottomSheetModal
      visible={visible}
      height={height - 30 - insets.top}
      onRequestClose={toggleBottomSheet}
      headerTitle={intl.formatMessage({
        defaultMessage: 'Edit Contact Card',
        description: 'Edit Contact Card Modal title',
      })}
      showGestureIndicator
      disableKeyboardAvoidingView
      headerLeftButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Edit contact card modal cancel button title',
          })}
          onPress={toggleBottomSheet}
          variant="secondary"
          style={styles.headerButton}
        />
      }
      headerRightButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Save',
            description: 'Edit contact card modal save button label',
          })}
          testID="save-contact-card"
          loading={isSubmitting}
          onPress={submit}
          variant="primary"
          style={styles.headerButton}
        />
      }
    >
      <ScrollView scrollEnabled={!state.rect} automaticallyAdjustKeyboardInsets>
        <View style={styles.sectionsContainer}>
          <View style={styles.sectionTitleContainer}>
            <Text variant="xsmall" style={styles.sectionTitle}>
              <FormattedMessage
                defaultMessage="Details"
                description="Section title fro basic infos of the contact card (firstname, lastname ...)"
              />
            </Text>
          </View>

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold">
                  <FormattedMessage
                    defaultMessage="First name"
                    description="First name registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold">
                  <FormattedMessage
                    defaultMessage="Last name"
                    description="Last name field registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  clearButtonMode="while-editing"
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold">
                  <FormattedMessage
                    defaultMessage="Title"
                    description="Job title field registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  clearButtonMode="while-editing"
                />
              </View>
            )}
          />
          <Controller
            control={control}
            name="company"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold">
                  <FormattedMessage
                    defaultMessage="Company name"
                    description="Company name field registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  clearButtonMode="while-editing"
                />
              </View>
            )}
          />

          <View style={styles.sectionTitleContainer}>
            <Text variant="xsmall" style={styles.sectionTitle}>
              <FormattedMessage
                defaultMessage="Phone number"
                description="Section title for phone numbers"
              />
            </Text>
          </View>

          <ContactCardEditModalPhones
            deleted={state.deleted}
            deleteButtonRect={state.rect}
            control={control}
            openDeleteButton={openDeleteButton}
            closeDeleteButton={closeDeleteButton}
          />

          <View style={styles.sectionTitleContainer}>
            <Text variant="xsmall" style={styles.sectionTitle}>
              <FormattedMessage
                defaultMessage="Email"
                description="Section title for emails"
              />
            </Text>
          </View>

          <ContactCardEditModalEmails
            deleted={state.deleted}
            deleteButtonRect={state.rect}
            control={control}
            openDeleteButton={openDeleteButton}
            closeDeleteButton={closeDeleteButton}
          />
        </View>
        {state.rect && (
          <Pressable
            style={styles.overlay}
            onPress={event => {
              if (
                state.rect &&
                event.nativeEvent.locationY >= state.rect.y &&
                event.nativeEvent.locationY <=
                  state.rect.y + state.rect.height &&
                event.nativeEvent.locationX >=
                  state.rect.x + state.rect.width - DELETE_BUTTON_WIDTH &&
                event.nativeEvent.locationX <= state.rect.x + state.rect.width
              ) {
                dispatch({
                  type: 'DELETE_FIELD',
                });
              } else {
                dispatch({
                  type: 'CLOSE_DELETION_OPTION',
                });
              }
            }}
          />
        )}
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  sectionTitleContainer: {
    backgroundColor: colors.grey100,
    height: 28,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { color: colors.grey600, textTransform: 'uppercase' },
  sectionsContainer: {
    paddingHorizontal: 10,
    rowGap: 20,
    paddingVertical: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ...ContactCardEditModalStyles,
});

export default ContactCardEditModal;
