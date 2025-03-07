import { ContactTypes } from 'expo-contacts';
import { sanitizeContact } from '#helpers/getLocalContactsMap';

describe('getLocalContactMap', () => {
  describe('sanitizeContact', () => {
    test('empty contact', () => {
      const contact = sanitizeContact({
        contactType: ContactTypes.Person,
        name: '',
      });
      expect(JSON.stringify(contact)).toBe(
        '{"contactType":"person","name":""}',
      );
    });
    test('sanitize socialLinks clean up label and url', () => {
      const contact = sanitizeContact({
        contactType: ContactTypes.Person,
        name: '',
        socialProfiles: [
          {
            label: 'TelEGram', // test corrupted label
            url: 'x-apple:t.me/bliblablu',
          },
        ],
      });
      expect(contact.socialProfiles?.[0]?.label).toBe('Telegram');
      expect(contact.socialProfiles?.[0]?.url).toBe('t.me/bliblablu');
    });
    test('sanitize socialLinks invalid label', () => {
      const contact = sanitizeContact({
        contactType: ContactTypes.Person,
        name: '',
        socialProfiles: [
          {
            label: 'duCaCa',
            url: 't.me/bliblablu',
          },
        ],
      });
      expect(contact.socialProfiles?.[0]?.label).toBe('Telegram');
    });
  });
});
