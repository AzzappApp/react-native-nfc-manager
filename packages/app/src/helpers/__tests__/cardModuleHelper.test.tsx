import { MODULE_VIDEO_MAX_WIDTH } from '@azzapp/shared/cardModuleHelpers';
import { downScaleImage } from '#helpers/resolutionHelpers';

describe('getExportResolution', () => {
  describe('video', () => {
    test('video landscape 16:9', () => {
      const resolution = downScaleImage(1024, 576, MODULE_VIDEO_MAX_WIDTH);
      expect(resolution.width).toBe(1024);
      expect(resolution.height).toBe(576);
    });
    test('video landscape 16:9 reduce 4K', () => {
      const resolution = downScaleImage(
        1024 * 2,
        576 * 2,
        MODULE_VIDEO_MAX_WIDTH,
      );
      expect(resolution.width).toBe(1980);
      expect(resolution.height).toBe(1113.75);
    });
    test('video landscape 16:9 small video', () => {
      const resolution = downScaleImage(
        1024 / 2,
        576 / 2,
        MODULE_VIDEO_MAX_WIDTH,
      );
      expect(resolution.width).toBe(1024 / 2);
      expect(resolution.height).toBe(576 / 2);
    });

    test('video portrait 16:9', () => {
      const resolution = downScaleImage(576, 1024, MODULE_VIDEO_MAX_WIDTH);
      expect(resolution.width).toBe(576);
      expect(resolution.height).toBe(1024);
    });
    test('video portrait 16:9 reduce 4K', () => {
      const resolution = downScaleImage(
        576 * 2,
        1024 * 2,
        MODULE_VIDEO_MAX_WIDTH,
      );
      expect(resolution.width).toBe(1113.75);
      expect(resolution.height).toBe(1980);
    });
    test('video portrait 16:9 small video', () => {
      const resolution = downScaleImage(
        576 / 2,
        1024 / 2,
        MODULE_VIDEO_MAX_WIDTH,
      );
      expect(resolution.width).toBe(576 / 2);
      expect(resolution.height).toBe(1024 / 2);
    });
  });
});
