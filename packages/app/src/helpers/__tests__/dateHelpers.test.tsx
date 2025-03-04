import { relativeDateMinute } from '#helpers/dateHelpers';

describe('dateHelpers', () => {
  describe('relativeDateMinute', () => {
    const RealDate = Date.now;

    beforeAll(() => {
      global.Date.now = jest.fn(() =>
        new Date('2023-06-01T00:00:00Z').getTime(),
      );
    });

    afterAll(() => {
      global.Date.now = RealDate;
    });
    test('should calculate the correct the past relative date in minutes', () => {
      const fromDate = '2023-05-01T12:00:00Z';

      const result = relativeDateMinute(fromDate);

      expect(result).toBe(-2635200);
    });

    test('should calculate the correct the futur relative date in minutes', () => {
      const fromDate = '2023-08-01T12:00:00Z';

      const result = relativeDateMinute(fromDate);

      expect(result).toBe(5313600);
    });
  });
});
