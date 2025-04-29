import { buildExpoContact } from '#helpers/contactListHelpers';

jest.mock('expo-file-system/next', () => {
  return {
    File: class MockExpoFile {
      uri: string;
      name: string;
      type: string;
      size: number;
      lastModified: number;
      constructor(uri: string) {
        this.uri = uri;
        this.name = 'mocked-file.jpg';
        this.type = 'image/jpeg';
        this.size = 1234;
        this.lastModified = Date.now();
      }
    },
    Paths: {
      DocumentDirectory: '/mocked/document/directory',
      CacheDirectory: '/mocked/cache/directory',
    },
  };
});

describe('buildExpoContact', () => {
  it('buildExpoContact generate correctly empty emails', async () => {
    const result = await buildExpoContact({
      emails: [],
      firstName: 'John',
      lastName: 'Doe',
      meetingDate: new Date('2012-12-21'),
    });
    expect(result.emails?.length).toBe(0);
  });
  it('buildExpoContact generate correctly emails', async () => {
    const result = await buildExpoContact({
      emails: [{ address: 'a@a.com', label: 'Work' }],
      firstName: 'John',
      lastName: 'Doe',
      meetingDate: new Date('2012-12-21'),
    });
    expect(result.emails?.length).toBe(1);
    expect(result.emails?.[0].email).toBe('a@a.com');
    expect(result.emails?.[0].label).toBe('Work');
  });
  it('buildExpoContact generate correct avatar uri', async () => {
    const result = await buildExpoContact({
      firstName: 'John',
      lastName: 'Doe',
      meetingDate: new Date('2012-12-21'),
      avatar: {
        uri: 'https://example.com/avatar.jpg',
      },
    });
    console.log('result', result);
    expect(result.imageAvailable).toBe(true);
    expect(result.image?.uri).toBe('https://example.com/avatar.jpg');
  });
});
