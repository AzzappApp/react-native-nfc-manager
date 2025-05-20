import {
  extractSeatsFromSubscriptionId,
  getSubscriptionChangeStatus,
  removeDynamicPartFromId,
  isSubscriptionBusinessWebcard,
  shouldUnpublishWebCard,
} from '../subscriptionHelpers';

describe('extractSeatsFromSubscriptionId', () => {
  test('should extract seat number from a standard id', () => {
    expect(extractSeatsFromSubscriptionId('com.azzap.dev.monthly.1')).toBe(1);
    expect(extractSeatsFromSubscriptionId('com.azzap.dev.yearly.10')).toBe(10);
  });

  test('should return 0 if there is no seat number', () => {
    expect(extractSeatsFromSubscriptionId('com.azzap.dev.monthly')).toBe(0);
    expect(extractSeatsFromSubscriptionId('')).toBe(0);
  });

  test('should return 0 if the last part is not a number', () => {
    expect(extractSeatsFromSubscriptionId('com.azzap.dev.monthly.abc')).toBe(0);
  });

  test('should extract seat number before colon in last part', () => {
    expect(extractSeatsFromSubscriptionId('com.azzap.dev.monthly.1:base')).toBe(
      1,
    );
    expect(
      extractSeatsFromSubscriptionId('com.azzap.dev.yearly.10:extra'),
    ).toBe(10);
    expect(
      extractSeatsFromSubscriptionId('com.azzap.dev.monthly.123:foo'),
    ).toBe(123);
  });

  test('should handle ids with extra dots', () => {
    expect(extractSeatsFromSubscriptionId('com.azzap.dev..monthly..5')).toBe(5);
  });
});

describe('getSubscriptionChangeStatus', () => {
  test('should detect seat upgrades', () => {
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.2',
        'P1M',
        'P1M',
      ),
    ).toBe(1);
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.yearly.5',
        'com.azzap.dev.yearly.10',
        'P1Y',
        'P1Y',
      ),
    ).toBe(1);
  });

  test('should detect seat downgrades', () => {
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.2',
        'com.azzap.dev.monthly.1',
        'P1M',
        'P1M',
      ),
    ).toBe(-1);
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.yearly.10',
        'com.azzap.dev.yearly.5',
        'P1Y',
        'P1Y',
      ),
    ).toBe(-1);
  });

  test('should detect duration upgrades', () => {
    // Monthly to quarterly
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P1M',
        'P3M',
      ),
    ).toBe(1);
    // Quarterly to semi-annual
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P3M',
        'P6M',
      ),
    ).toBe(1);
    // Semi-annual to annual
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P6M',
        'P1Y',
      ),
    ).toBe(1);
    // Annual to biennial
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P1Y',
        'P2Y',
      ),
    ).toBe(1);
    // Biennial to triennial
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P2Y',
        'P3Y',
      ),
    ).toBe(1);
  });

  test('should detect duration downgrades', () => {
    // Quarterly to monthly
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P3M',
        'P1M',
      ),
    ).toBe(-1);
    // Semi-annual to quarterly
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P6M',
        'P3M',
      ),
    ).toBe(-1);
    // Annual to semi-annual
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P1Y',
        'P6M',
      ),
    ).toBe(-1);
    // Biennial to annual
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P2Y',
        'P1Y',
      ),
    ).toBe(-1);
    // Triennial to biennial
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P3Y',
        'P2Y',
      ),
    ).toBe(-1);
  });

  test('should return 0 for same subscription', () => {
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'com.azzap.dev.monthly.1',
        'P1M',
        'P1M',
      ),
    ).toBe(0);
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.yearly.5',
        'com.azzap.dev.yearly.5',
        'P1Y',
        'P1Y',
      ),
    ).toBe(0);
  });

  test('should handle invalid subscription IDs', () => {
    expect(
      getSubscriptionChangeStatus('invalid', 'invalid', 'P1M', 'P1M'),
    ).toBe(0);
    expect(
      getSubscriptionChangeStatus(
        'com.azzap.dev.monthly.1',
        'invalid',
        'P1M',
        'P1M',
      ),
    ).toBe(0);
  });
});

describe('removeDynamicPartFromId', () => {
  test('should remove dynamic part after colon', () => {
    expect(removeDynamicPartFromId('com.azzap.xxxX.wxcwxcwxc.azae:XXXX')).toBe(
      'com.azzap.xxxX.wxcwxcwxc.azae',
    );
    expect(removeDynamicPartFromId('com.azzap.xxxX.wxcwxcwxc.azae:1234')).toBe(
      'com.azzap.xxxX.wxcwxcwxc.azae',
    );
    expect(removeDynamicPartFromId('com.azzap.xxxX.wxcwxcwxc.azae:base')).toBe(
      'com.azzap.xxxX.wxcwxcwxc.azae',
    );
  });

  test('should return original string if no colon present', () => {
    expect(removeDynamicPartFromId('com.azzap.xxxX.wxcwxcwxc.azae')).toBe(
      'com.azzap.xxxX.wxcwxcwxc.azae',
    );
    expect(removeDynamicPartFromId('com.azzap.xxxX.wxcwxcwxc.azae.extra')).toBe(
      'com.azzap.xxxX.wxcwxcwxc.azae.extra',
    );
  });

  test('should handle empty string', () => {
    expect(removeDynamicPartFromId('')).toBe('');
  });
});

describe('isSubscriptionBusinessWebcard', () => {
  test('should return true for non-personal webCardKind', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: { webCardKind: 'business', isMultiUser: false },
        profile: { contactCard: null, logoId: null },
      }),
    ).toBe(true);
  });

  test('should return true for multi-user webCard', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: { webCardKind: 'personal', isMultiUser: true },
        profile: { contactCard: null, logoId: null },
      }),
    ).toBe(true);
  });

  test('should return true when profile has company name', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: { webCardKind: 'personal', isMultiUser: false },
        profile: {
          contactCard: { company: 'Test Company', urls: [] },
          logoId: null,
        },
      }),
    ).toBe(true);
  });

  test('should return true when profile has URLs', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: { webCardKind: 'personal', isMultiUser: false },
        profile: {
          contactCard: {
            company: null,
            urls: [{ address: 'https://example.com' }],
          },
          logoId: null,
        },
      }),
    ).toBe(true);
  });

  test('should return true when profile has logo', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: { webCardKind: 'personal', isMultiUser: false },
        profile: {
          contactCard: { company: null, urls: [] },
          logoId: 'logo-123',
        },
      }),
    ).toBe(true);
  });

  test('should return false for personal webCard without business features', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: { webCardKind: 'personal', isMultiUser: false },
        profile: {
          contactCard: { company: null, urls: [] },
          logoId: null,
        },
      }),
    ).toBe(false);
  });

  test('should handle null webCard', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: null,
        profile: {
          contactCard: { company: null, urls: [] },
          logoId: null,
        },
      }),
    ).toBe(false);
  });

  test('should handle undefined webCard', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: undefined,
        profile: {
          contactCard: { company: null, urls: [] },
          logoId: null,
        },
      }),
    ).toBe(false);
  });

  test('should handle null contactCard', () => {
    expect(
      isSubscriptionBusinessWebcard({
        webCard: { webCardKind: 'personal', isMultiUser: false },
        profile: {
          contactCard: null,
          logoId: null,
        },
      }),
    ).toBe(false);
  });
});

describe('shouldUnpublishWebCard', () => {
  test('should return false if webCard is not published', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: false,
          webCardKind: 'business',
          isMultiUser: false,
        },
        nbProfiles: 1,
        profile: { contactCard: null, logoId: null },
      }),
    ).toBe(false);
  });

  test('should return false if webCard is null', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: null,
        nbProfiles: 1,
        profile: { contactCard: null, logoId: null },
      }),
    ).toBe(false);
  });

  test('should return false if webCard is undefined', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: undefined,
        nbProfiles: 1,
        profile: { contactCard: null, logoId: null },
      }),
    ).toBe(false);
  });

  test('should return true if number of profiles is greater than 2', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: true,
          webCardKind: 'personal',
          isMultiUser: false,
        },
        nbProfiles: 3,
        profile: { contactCard: null, logoId: null },
      }),
    ).toBe(true);
  });

  test('should return true for business webCard', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: true,
          webCardKind: 'business',
          isMultiUser: false,
        },
        nbProfiles: 1,
        profile: { contactCard: null, logoId: null },
      }),
    ).toBe(true);
  });

  test('should return true for multi-user webCard', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: true,
          webCardKind: 'personal',
          isMultiUser: true,
        },
        nbProfiles: 1,
        profile: { contactCard: null, logoId: null },
      }),
    ).toBe(true);
  });

  test('should return true when profile has company name', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: true,
          webCardKind: 'personal',
          isMultiUser: false,
        },
        nbProfiles: 1,
        profile: {
          contactCard: { company: 'Test Company', urls: [] },
          logoId: null,
        },
      }),
    ).toBe(true);
  });

  test('should return true when profile has URLs', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: true,
          webCardKind: 'personal',
          isMultiUser: false,
        },
        nbProfiles: 1,
        profile: {
          contactCard: {
            company: null,
            urls: [{ address: 'https://example.com' }],
          },
          logoId: null,
        },
      }),
    ).toBe(true);
  });

  test('should return true when profile has logo', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: true,
          webCardKind: 'personal',
          isMultiUser: false,
        },
        nbProfiles: 1,
        profile: {
          contactCard: { company: null, urls: [] },
          logoId: 'logo-123',
        },
      }),
    ).toBe(true);
  });

  test('should return false for personal webCard without business features and less than 3 profiles', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: true,
          webCardKind: 'personal',
          isMultiUser: false,
        },
        nbProfiles: 2,
        profile: {
          contactCard: { company: null, urls: [] },
          logoId: null,
        },
      }),
    ).toBe(false);
  });

  test('should handle null contactCard', () => {
    expect(
      shouldUnpublishWebCard({
        webCard: {
          cardIsPublished: true,
          webCardKind: 'personal',
          isMultiUser: false,
        },
        nbProfiles: 1,
        profile: {
          contactCard: null,
          logoId: null,
        },
      }),
    ).toBe(false);
  });
});
