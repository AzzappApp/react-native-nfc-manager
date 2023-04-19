import '@testing-library/jest-native/extend-expect';
import range from 'lodash/range';
import {
  RelayEnvironmentProvider,
  graphql,
  useLazyLoadQuery,
} from 'react-relay';
import { MockPayloadGenerator, createMockEnvironment } from 'relay-test-utils';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { segmentImage } from '#helpers/mediaHelpers';
import { act, fireEvent, render, screen, within } from '#helpers/testHelpers';
import CoverEditionScreen from '../CoverEditionScreen';
import type { ImagePickerProps } from '#components/ImagePicker/ImagePicker';
import type { CoverEditionScreenProps } from '../CoverEditionScreen';
import type { CoverEditionScreen_cover$data } from '@azzapp/relay/artifacts/CoverEditionScreen_cover.graphql';
import type { CoverEditionScreenTestQuery } from '@azzapp/relay/artifacts/CoverEditionScreenTestQuery.graphql';
import type { ReactTestInstance } from 'react-test-renderer';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

//mock Image.resolveAssetSource
jest.mock('react-native/Libraries/Image/resolveAssetSource', () => ({
  __esModule: true,
  default: () => {
    return {
      width: 100,
      height: 100,
      uri: 'http://fake-site/fake-media.jpg',
      scale: 1,
    };
  },
}));
jest.mock('#components/ImagePicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const ImagePicker = (props: ImagePickerProps) =>
    React.createElement('ImagePicker', { ...props, testID: 'image-picker' });
  return {
    __esModule: true,
    default: ImagePicker,
    ImagePickerStep: 'ImagePickerStep',
  };
});

jest.mock('#helpers/mediaHelpers', () => ({
  segmentImage: jest.fn(),
  useAvailableFonts: jest
    .fn()
    .mockResolvedValue([
      'Arial',
      'Avenir',
      'Helvetica',
      'Times New Roman',
      'Georgia',
    ]),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockWebAPI = {
  uploadSign: jest.fn(),
  uploadMedia: jest.fn(),
};

jest.mock('#PlatformEnvironment', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  return {
    useRouter() {
      return mockRouter;
    },
    useWebAPI() {
      return mockWebAPI;
    },

    PlatformEnvironmentProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => {
      return <>{children}</>;
    },
  };
});

const segmentImageMock = segmentImage as jest.MockedFunction<
  typeof segmentImage
>;

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

jest.mock('#components/medias', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const EditableImageWithCropMode = (props: any) =>
    React.createElement('EditableImageWithCropMode', {
      ...props,
      testID: 'editable-image',
    });

  return {
    __esModule: true,
    EditableImageWithCropMode,
  };
});

jest.mock('#components/FilterSelectionList', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const FilterSelectionList = (props: any) =>
    React.createElement('FilterSelectionList', {
      ...props,
      testID: 'filter-selection-list',
    });
  return FilterSelectionList;
});

jest.mock('#components/ImageEditionParameterControl', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const ImageEditionParameterControl = (props: any) =>
    React.createElement('ImageEditionParameterControl', {
      ...props,
      testID: 'image-edition-parameter-control',
    });

  return ImageEditionParameterControl;
});

jest.mock('#components/ImageEditionParametersList', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const ImageEditionParametersList = (props: any) =>
    React.createElement('ImageEditionParametersList', {
      ...props,
      testID: 'image-edition-parameters-list',
    });
  return ImageEditionParametersList;
});

jest.mock('#ui/FontPicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const FontPicker = (props: any) =>
    React.createElement('FontPicker', {
      ...props,
      testID: 'font-picker',
    });
  return FontPicker;
});

jest.mock('#screens/CoverEditionScreen/CoverModelsEditionPanel', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');

  const CoverModelsEditionPanel = (props: any) =>
    React.createElement('CoverModelsEditionPanel', {
      ...props,
      testID: 'cover-models-edition-panel',
    });
  return CoverModelsEditionPanel;
});

jest.mock('#components/ProfileColorPalette', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const ProfileColorPaletteModal = (props: any) =>
    React.createElement('ProfileColorPaletteModal', {
      ...props,
      testID: 'profile-color-palette-modal',
    });
  const ProfileColorPalette = (props: any) =>
    React.createElement('ProfileColorPalette', {
      ...props,
      testID: 'profile-color-palette',
    });
  return {
    __esModule: true,
    default: ProfileColorPalette,
    ProfileColorPaletteModal,
  };
});

describe('CoverEditionScreen', () => {
  let environement: RelayMockEnvironment;

  type CoverData = Omit<CoverEditionScreen_cover$data, ' $fragmentType'>;

  const renderCoverEditionScreen = ({
    coverData = null,
    profileKind = 'personal',
    ...props
  }: Partial<
    CoverEditionScreenProps & {
      coverData: CoverData | null;
      profileKind: 'business' | 'personal';
    }
  > = {}) => {
    environement = createMockEnvironment();
    environement.mock.queueOperationResolver(operation =>
      MockPayloadGenerator.generate(operation, {
        Viewer: () => ({
          id: 'viewerId',
          profile: {
            id: 'profileId',
            card: {
              id: 'cardId',
              cover: coverData,
            },
            firstName: '',
            lastName: '',
            companyName: '',
            profileKind,
            colorPalette: ['#233423'],
          },
          coverBackgrounds: range(10).map(i => ({
            id: `coverBackgroundId${i}`,
            uri: `https://example.com/coverBackground${i}.png`,
          })),
          coverForegrounds: range(10).map(i => ({
            id: `coverForegroundId${i}`,
            uri: `https://example.com/coverForeground${i}.png`,
          })),
        }),
      }),
    );

    const TestRenderer = (props?: Partial<CoverEditionScreenProps>) => {
      const data = useLazyLoadQuery<CoverEditionScreenTestQuery>(
        graphql`
          query CoverEditionScreenTestQuery @relay_test_operation {
            viewer {
              ...CoverEditionScreen_viewer
            }
          }
        `,
        {},
      );
      return <CoverEditionScreen viewer={data.viewer} {...props} />;
    };

    return render(
      <RelayEnvironmentProvider environment={environement}>
        <TestRenderer {...props} />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should not render ImagePicker if there is no cover, or on image picker button', () => {
    const { unmount } = renderCoverEditionScreen();
    expect(screen.queryByTestId('image-picker')).not.toBeTruthy();
    unmount();
    renderCoverEditionScreen({
      coverData: {
        sourceMedia: {
          id: 'sourceMedia',
          uri: 'http://fake-site/fake-media.jpg',
          width: 100,
          height: 100,
        },
        maskMedia: null,
        segmented: false,
        merged: false,
        background: null,
        backgroundStyle: null,
        foreground: null,
        foregroundStyle: null,
        title: 'title',
        titleStyle: null,
        subTitle: null,
        subTitleStyle: null,
        contentStyle: null,
        mediaStyle: null,
      },
    });
    expect(screen.queryByTestId('image-picker')).not.toBeTruthy();
    act(() => {
      fireEvent.press(screen.getByLabelText('Select an image'));
    });
    expect(screen.queryByTestId('image-picker')).toBeTruthy();
  });

  test('Should hide ImagePicker when user cancel if a sourceMedia exist', () => {
    renderCoverEditionScreen();
    act(() => {
      fireEvent.press(screen.getByLabelText('Select an image'));
    });
    act(() => {
      fireEvent(screen.getByTestId('image-picker'), 'finished', {
        uri: 'http://fake-site/fake-media.jpg',
        width: 100,
        height: 100,
        editionParameters: {},
      });
    });
    expect(screen.queryByTestId('image-picker')).not.toBeTruthy();
    act(() => {
      fireEvent.press(screen.getByLabelText('Select an image'));
    });
    expect(screen.queryByTestId('image-picker')).toBeTruthy();
    act(() => {
      fireEvent(screen.getByTestId('image-picker'), 'cancel');
    });
    expect(screen.queryByTestId('image-picker')).not.toBeTruthy();
  });

  test('Should compute the mask media when an image is selected and should apply the mask when the segmented button is checked', async () => {
    renderCoverEditionScreen();

    act(() => {
      fireEvent(screen.getAllByRole('switch')[0], 'valueChange', false);
    });
    segmentImageMock.mockResolvedValueOnce('/data/fake-mask.jpg');
    act(() => {
      fireEvent.press(screen.getByLabelText('Select an image'));
    });
    act(() => {
      fireEvent(screen.getByTestId('image-picker'), 'finished', {
        uri: 'file:///data/fake-media.jpg',
        width: 100,
        height: 100,
        editionParameters: {},
      });
    });
    expect(segmentImageMock).toHaveBeenCalledWith(
      'file:///data/fake-media.jpg',
    );
    await act(flushPromises);
    expect(screen.getByTestId('editable-image')).not.toHaveProp(
      'source',
      expect.objectContaining({
        uri: 'file:///data/fake-media.jpg',
        maskUri: 'file:///data/fake-mask.jpg',
      }),
    );

    act(() => {
      fireEvent(screen.getAllByRole('switch')[0], 'valueChange', true);
    });
    expect(screen.getByTestId('editable-image')).toHaveProp(
      'source',
      expect.objectContaining({
        uri: 'file:///data/fake-media.jpg',
        maskUri: 'file:///data/fake-mask.jpg',
      }),
    );

    segmentImageMock.mockResolvedValueOnce('/data/fake-mask2.jpg');
    act(() => {
      fireEvent.press(screen.getByLabelText('Select an image'));
    });
    act(() => {
      fireEvent(screen.getByTestId('image-picker'), 'finished', {
        uri: 'file:///data/fake-media2.jpg',
        width: 100,
        height: 100,
        editionParameters: {},
      });
    });
    await act(flushPromises);

    expect(screen.getByTestId('editable-image')).toHaveProp(
      'source',
      expect.objectContaining({
        uri: 'file:///data/fake-media2.jpg',
        maskUri: 'file:///data/fake-mask2.jpg',
      }),
    );
  });

  const fakeCover: CoverData = {
    background: {
      id: 'coverBackgroundId2',
      uri: 'https://example.com/coverBackground2.png',
    },
    backgroundStyle: {
      backgroundColor: '#FF0000',
      patternColor: '#00FF00',
    },
    contentStyle: {
      orientation: 'topToBottom',
      placement: 'middleRight',
    },
    foreground: {
      id: 'coverForegroundId3',
      uri: 'https://example.com/coverForeground3.png',
    },
    foregroundStyle: {
      color: '#0000FF',
    },
    maskMedia: {
      id: 'maskMediaId',
      uri: 'http://fake-site/fake-mask.jpg',
    },
    mediaStyle: {
      parameters: {
        brightness: 0.5,
      },
      filter: 'corail',
    },
    merged: false,
    segmented: true,
    sourceMedia: {
      id: 'sourceMediaId',
      uri: 'http://fake-site/fake-media.jpg',
      width: 1200,
      height: 1920,
    },
    subTitle: 'fake-subtitle',
    subTitleStyle: {
      color: '#0A0F00',
      fontSize: 12,
      fontFamily: 'Arial',
    },
    title: 'fake-title',
    titleStyle: {
      color: '#0400E0',
      fontSize: 12,
      fontFamily: 'Verdana',
    },
  };

  test('Should render a preview of edited the cover', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    const image = screen.getByTestId('editable-image');
    expect(image).toHaveProp('source', {
      kind: 'image',
      uri: 'http://fake-site/fake-media.jpg',
      backgroundUri: 'https://example.com/coverBackground2.png',
      maskUri: 'http://fake-site/fake-mask.jpg',
      foregroundUri: 'https://example.com/coverForeground3.png',
    });
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.5,
    });
    expect(image).toHaveProp('filters', ['corail']);
    expect(image).toHaveProp('backgroundImageColor', '#FF0000');
    expect(image).toHaveProp('backgroundImageTintColor', '#00FF00');
    expect(image).toHaveProp('foregroundImageTintColor', '#0000FF');

    const title = screen.getByText('fake-title');
    expect(title).toHaveStyle({
      color: '#0400E0',
      fontSize: 12,
      fontFamily: 'Verdana',
    });

    const subTitle = screen.getByText('fake-subtitle');
    expect(subTitle).toHaveStyle({
      color: '#0A0F00',
      fontSize: 12,
      fontFamily: 'Arial',
    });
    // TODO test orientation and placement ?
  });

  test('Should activate the cropEditionMode when user click on the crop button', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    const image = screen.getByTestId('editable-image');
    expect(image).toHaveProp('cropEditionMode', false);
    act(() => {
      fireEvent.press(screen.getByLabelText('Crop'));
    });
    expect(image).toHaveProp('cropEditionMode', true);
    act(() => {
      fireEvent(image, 'cropDataChange', {
        x: 0,
        y: 0,
        width: 100,
        height: 200,
      });
    });
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.5,
      cropData: {
        x: 0,
        y: 0,
        width: 100,
        height: 200,
      },
    });

    const rollControl = screen.getByTestId('image-edition-parameter-control');
    expect(rollControl).toHaveProp('parameter', 'roll');
    act(() => {
      fireEvent(rollControl, 'change', 20);
    });
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.5,
      roll: 20,
      cropData: {
        x: 0,
        y: 0,
        width: 100,
        height: 200,
      },
    });
    act(() => {
      fireEvent.press(screen.getByLabelText('Rotate'));
    });
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.5,
      roll: 20,
      orientation: 'LEFT',
      cropData: {
        x: 0,
        y: 0,
        width: 100,
        height: 200,
      },
    });
    act(() => {
      fireEvent.press(screen.getByText('Cancel').parent!);
    });

    expect(image).toHaveProp('cropEditionMode', false);
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.5,
    });
  });

  test('Should activate the merge option when user toggle the merge switch', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Text'));
    });

    const image = screen.getByTestId('editable-image');
    expect(image).toHaveProp('backgroundMultiply', false);
    act(() => {
      fireEvent(screen.getAllByRole('switch')[1], 'valueChange', true);
    });
    expect(image).toHaveProp('backgroundMultiply', true);
  });

  test('Should update the filter when user select a new one', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Image'));
    });

    const image = screen.getByTestId('editable-image');
    expect(image).toHaveProp('filters', ['corail']);
    act(() => {
      fireEvent(screen.getByTestId('filter-selection-list'), 'change', 'sepia');
    });
    expect(image).toHaveProp('filters', ['sepia']);
  });

  test('Should enter in parameter edition mode when user select a parameter', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Image'));
    });

    const image = screen.getByTestId('editable-image');
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.5,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Adjust'));
    });
    act(() => {
      fireEvent(
        screen.getByTestId('image-edition-parameters-list'),
        'selectParam',
        'brightness',
      );
    });
    act(() => {
      fireEvent(
        screen.getByTestId('image-edition-parameter-control'),
        'change',
        0.8,
      );
    });
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.8,
    });
    act(() => {
      fireEvent.press(screen.getAllByText('Cancel')[1].parent!);
    });
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.5,
    });
    expect(screen.queryByTestId('image-edition-parameter-control')).toBeNull();

    act(() => {
      fireEvent.press(screen.getByLabelText('Adjust'));
    });
    act(() => {
      fireEvent(
        screen.getByTestId('image-edition-parameters-list'),
        'selectParam',
        'brightness',
      );
    });
    act(() => {
      fireEvent(
        screen.getByTestId('image-edition-parameter-control'),
        'change',
        0.9,
      );
    });
    act(() => {
      fireEvent.press(screen.getByText('Validate').parent!);
    });
    expect(image).toHaveProp('editionParameters', {
      brightness: 0.9,
    });
    expect(screen.queryByTestId('image-edition-parameter-control')).toBeNull();
  });

  test('Should update the title and subtitle parameters when the user change them', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });
    act(() => {
      fireEvent.press(screen.getByLabelText('Text'));
    });

    expect(screen.queryByText('fake-title')).toBeTruthy();
    act(() => {
      fireEvent(
        screen.getByPlaceholderText('Title'),
        'changeText',
        'new-title',
      );
    });
    expect(screen.queryByText('fake-title')).not.toBeTruthy();

    expect(screen.queryByText('new-title')).toBeTruthy();

    const testStyleChangeFor = (text: ReactTestInstance) => {
      // Font change tests
      expect(screen.queryByTestId('font-picker')).toHaveProp('visible', false);
      act(() => {
        fireEvent.press(screen.getByLabelText('Font'));
      });
      expect(screen.queryByTestId('font-picker')).toHaveProp('visible', true);
      expect(text).not.toHaveStyle({
        fontFamily: 'Helvetica',
      });
      act(() => {
        fireEvent(screen.getByTestId('font-picker'), 'change', 'Helvetica');
      });
      expect(text).toHaveStyle({
        fontFamily: 'Helvetica',
      });
      expect(screen.queryByTestId('font-picker')).toHaveProp('visible', true);
      act(() => {
        fireEvent(screen.getByTestId('font-picker'), 'requestClose');
      });
      expect(screen.queryByTestId('font-picker')).toHaveProp('visible', false);

      // Color change tests
      expect(screen.queryAllByTestId('profile-color-palette')[0]).toHaveProp(
        'visible',
        false,
      );
      act(() => {
        fireEvent.press(screen.getAllByLabelText('Color')[0]);
      });
      expect(screen.queryAllByTestId('profile-color-palette')[0]).toHaveProp(
        'visible',
        true,
      );

      expect(text).not.toHaveStyle({
        color: '#FF3322',
      });
      act(() => {
        fireEvent(
          screen.queryAllByTestId('profile-color-palette')[0],
          'changeColor',
          '#FF3322',
        );
      });
      expect(text).toHaveStyle({
        color: '#FF3322',
      });
      expect(screen.queryAllByTestId('profile-color-palette')[0]).toHaveProp(
        'visible',
        true,
      );
      act(() => {
        fireEvent(
          screen.queryAllByTestId('profile-color-palette')[0],
          'requestClose',
        );
      });
      expect(screen.queryAllByTestId('profile-color-palette')[0]).toHaveProp(
        'visible',
        false,
      );

      // font size change tests
      expect(text).not.toHaveStyle({
        fontSize: 24,
      });
      act(() => {
        fireEvent(screen.getByLabelText('Font size'), 'change', 24);
      });
      expect(text).toHaveStyle({
        fontSize: 24,
      });
    };

    testStyleChangeFor(screen.getByText('new-title'));

    act(() => {
      fireEvent.press(screen.getByLabelText('Subtitle'));
    });

    expect(screen.queryByText('fake-subtitle')).toBeTruthy();
    act(() => {
      fireEvent(
        screen.getByPlaceholderText('Subtitle'),
        'changeText',
        'new-subtitle',
      );
    });
    expect(screen.queryByText('fake-subtitle')).not.toBeTruthy();
    expect(screen.queryByText('new-subtitle')).toBeTruthy();

    testStyleChangeFor(screen.getByText('new-subtitle'));

    const placementButton = screen.getByLabelText('Position');
    expect(placementButton.props.accessibilityValue.text).toBe('Middle right');
    act(() => {
      fireEvent.press(placementButton);
    });
    expect(placementButton.props.accessibilityValue.text).toBe('Bottom left');

    const orientationButton = screen.getByLabelText('Orientation');
    expect(orientationButton.props.accessibilityValue.text).toBe(
      'Top to bottom',
    );
    act(() => {
      fireEvent.press(orientationButton);
    });
    expect(orientationButton.props.accessibilityValue.text).toBe('Horizontal');
  });

  test('Should update the foreground image when the user select a new one', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });
    act(() => {
      fireEvent.press(screen.getByLabelText('Fore.'));
    });

    const list = screen.getByTestId('cover-layer-list-foreground');
    const foregroundsButtons = within(list).getAllByRole('button');

    expect(foregroundsButtons).toHaveLength(10);

    const image = screen.getByTestId('editable-image');
    expect(image).not.toHaveProp(
      'source',
      expect.objectContaining({
        uri: 'https://example.com/coverForeground7.png',
      }),
    );
    act(() => {
      fireEvent.press(foregroundsButtons[8]);
    });
    expect(image).toHaveProp(
      'source',
      expect.objectContaining({
        foregroundUri: 'https://example.com/coverForeground7.png',
      }),
    );

    act(() => {
      fireEvent.press(screen.getAllByLabelText('Color')[1]);
    });

    act(() => {
      fireEvent(
        screen.getAllByTestId('profile-color-palette')[2],
        'changeColor',
        '#123456',
      );
    });
    expect(image).toHaveProp('foregroundImageTintColor', '#123456');
  });

  test('Should update the background image when the user select a new one', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });
    act(() => {
      fireEvent.press(screen.getByLabelText('Back.'));
    });

    const list = screen.getByTestId('cover-layer-list-background');
    const backgroundsButtons = within(list).getAllByRole('button');

    expect(backgroundsButtons).toHaveLength(10);

    const image = screen.getByTestId('editable-image');
    expect(image).not.toHaveProp(
      'source',
      expect.objectContaining({
        uri: 'https://example.com/coverBackground4.png',
      }),
    );
    act(() => {
      fireEvent.press(backgroundsButtons[5]);
    });
    expect(image).toHaveProp(
      'source',
      expect.objectContaining({
        backgroundUri: 'https://example.com/coverBackground4.png',
      }),
    );

    act(() => {
      fireEvent.press(screen.getByLabelText('Color #1'));
    });

    act(() => {
      fireEvent(
        screen.getAllByTestId('profile-color-palette')[1],
        'changeColor',
        '#434239',
      );
    });
    expect(image).toHaveProp('backgroundImageTintColor', '#434239');

    act(() => {
      fireEvent.press(screen.getByLabelText('Color #2'));
    });

    act(() => {
      fireEvent(
        screen.getAllByTestId('profile-color-palette')[1],
        'changeColor',
        '#FF34A2',
      );
    });
    expect(image).toHaveProp('backgroundImageColor', '#FF34A2');
  });

  test('Should allow to cancel in case of creation', () => {
    renderCoverEditionScreen();
    expect(screen.queryByText('Cancel')).toBeTruthy();
  });

  test('Should allow to save if the title is not empty, and if the sourceMedia is not empty', async () => {
    renderCoverEditionScreen();
    let saveButton = screen.getByText('Save');
    while (saveButton.props.accessibilityRole !== 'button') {
      if (!saveButton.parent) {
        throw new Error('save button not found');
      }
      saveButton = saveButton.parent;
    }

    expect(saveButton).toHaveProp('accessibilityState', { disabled: true });
    segmentImageMock.mockResolvedValueOnce('/data/fake-mask.jpg');
    expect(screen.queryByTestId('image-picker')).not.toBeTruthy();
    act(() => {
      fireEvent.press(screen.getByLabelText('Select an image'));
    });
    act(() => {
      fireEvent(screen.getByTestId('image-picker'), 'finished', {
        uri: 'http://fake-site/fake-media.jpg',
        width: 100,
        height: 100,
        editionParameters: {},
      });
    });
    await act(flushPromises);

    expect(saveButton).toHaveProp('accessibilityState', { disabled: true });
    act(() => {
      fireEvent.press(screen.getByLabelText('Text'));
    });
    act(() => {
      fireEvent(
        screen.getByPlaceholderText('Title'),
        'changeText',
        'new-title',
      );
    });

    expect(saveButton).toHaveProp('accessibilityState', { disabled: false });
  });

  xtest('Should save the cover', () => {
    // TODO implement this test once the save is implemented in production mode
  });
});
