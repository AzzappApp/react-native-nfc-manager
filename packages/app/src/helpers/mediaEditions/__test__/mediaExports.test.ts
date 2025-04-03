import { Skia, ImageFormat } from '@shopify/react-native-skia';
import { convertSvgToImageFile } from '../mediasExport';

// Mocks

jest.mock('react-native-compressor', () => ({ compress: jest.fn() }));

jest.mock('@shopify/react-native-skia', () => ({
  Skia: {
    SVG: {
      MakeFromString: jest.fn(),
    },
    Surface: {
      MakeOffscreen: jest.fn(),
    },
    Paint: jest.fn(() => ({})),
  },
  ImageFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
}));

jest.mock('expo-file-system/next', () => ({
  Paths: { cache: { uri: '/mock/cache/' } },
  File: jest.fn().mockImplementation(path => ({
    path,
    create: jest.fn(),
    write: jest.fn(),
  })),
}));

describe('convertSvgToImageFile', () => {
  const mockSvg = '<svg width="100" height="100"></svg>';
  const mockSvgObject = {
    width: () => 100,
    height: () => 100,
    dispose: jest.fn(),
  };
  const mockCanvas = {
    drawPaint: jest.fn(),
    scale: jest.fn(),
    drawSvg: jest.fn(),
  };
  const mockSurface = {
    getCanvas: () => mockCanvas,
    makeImageSnapshot: () => ({
      encodeToBytes: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }),
    dispose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Skia.SVG.MakeFromString as jest.Mock).mockReturnValue(mockSvgObject);
    (Skia.Surface.MakeOffscreen as jest.Mock).mockReturnValue(mockSurface);
  });

  it('saves a valid SVG to file and returns the file path', async () => {
    const result = await convertSvgToImageFile({
      filePath: 'test_image',
      svg: mockSvg,
      resolution: { width: 100, height: 100 },
      format: ImageFormat.PNG,
      quality: 95,
    });

    expect(result).toBe('/mock/cache/test_image.png');
  });

  it('returns undefined if svg cannot be parsed', async () => {
    (Skia.SVG.MakeFromString as jest.Mock).mockReturnValueOnce(undefined);
    const result = await convertSvgToImageFile({
      filePath: 'fail_image',
      svg: '<invalid>',
      resolution: { width: 100, height: 100 },
      format: ImageFormat.PNG,
      quality: 80,
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined if surface creation fails', async () => {
    (Skia.Surface.MakeOffscreen as jest.Mock).mockReturnValueOnce(undefined);
    const result = await convertSvgToImageFile({
      filePath: 'no_surface',
      svg: mockSvg,
      resolution: { width: 100, height: 100 },
      format: ImageFormat.JPEG,
      quality: 80,
    });

    expect(result).toBeUndefined();
  });
});
