import { buildExpoContact } from '#helpers/contactListHelpers';

describe('buildExpoContact', () => {
  it('buildExpoContact generate correctly empty emails', async () => {
    const result = await buildExpoContact({
      emails: [],
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date('2012-12-21'),
    });
    expect(result.emails?.length).toBe(0);
  });
  it('buildExpoContact generate correctly emails', async () => {
    const result = await buildExpoContact({
      emails: [{ address: 'a@a.com', label: 'Work' }],
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date('2012-12-21'),
    });
    expect(result.emails?.length).toBe(1);
    expect(result.emails?.[0].email).toBe('a@a.com');
    expect(result.emails?.[0].label).toBe('Work');
  });
});
