import { Fields, getContactsAsync } from 'expo-contacts';

export const getLocalContactsMap = async () => {
  const { data } = await getContactsAsync({
    fields: [Fields.Emails, Fields.PhoneNumbers, Fields.ID],
  });
  return data;
};
