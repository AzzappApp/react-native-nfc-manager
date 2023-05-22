import '@testing-library/jest-native/extend-expect';
import range from 'lodash/range';
import { StyleSheet } from 'react-native';
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
import type { GPULayer } from '#components/gpu';
import type { ImagePickerProps } from '#components/ImagePicker/ImagePicker';
import type { CoverEditionScreenProps } from '../CoverEditionScreen';
import type { CoverEditionScreen_cover$data } from '@azzapp/relay/artifacts/CoverEditionScreen_cover.graphql';
import type { CoverEditionScreen_template$data } from '@azzapp/relay/artifacts/CoverEditionScreen_template.graphql';
import type { CoverEditionScreenTestQuery } from '@azzapp/relay/artifacts/CoverEditionScreenTestQuery.graphql';
import type { ReactTestInstance } from 'react-test-renderer';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

// this mock is needed to test the merge switch
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: '16',
  select: () => null,
}));
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

jest.mock('#ui/FontDropDownPicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const FontPicker = (props: any) =>
    React.createElement('FontDropDownPicker', {
      ...props,
      testID: 'font-dropdown-picker',
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

jest.mock('#components/ProfileColorPicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const ProfileColorDropDownPicker = (props: any) =>
    React.createElement('ProfileColorDropDownPicker', {
      ...props,
      testID: 'profile-dropdow-color-picker',
    });
  const ProfileColorPicker = (props: any) =>
    React.createElement('ProfileColorPicker', {
      ...props,
      testID: 'profile-color-picker',
    });
  return {
    __esModule: true,
    default: ProfileColorPicker,
    ProfileColorDropDownPicker,
  };
});

jest.mock('#components/gpu/GPUNativeMethods');
jest.mock('@react-native-camera-roll/camera-roll', () => ({}));

jest.mock('#components/Cropper', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View } = require('react-native');
  const Cropper = ({ children, ...props }: any) => (
    <View {...props} testID="cropper">
      {children(props.cropData)}
    </View>
  );

  return Cropper;
});

jest.mock('#components/medias/NativeMediaImageRenderer');
jest.mock('#components/medias/NativeMediaVideoRenderer');

describe('CoverEditionScreen', () => {
  let environement: RelayMockEnvironment;

  type CoverData = Omit<CoverEditionScreen_cover$data, ' $fragmentType'>;
  type TemplateData = Omit<CoverEditionScreen_template$data, ' $fragmentType'>;

  const renderCoverEditionScreen = ({
    coverData = null,
    profileKind = 'personal',
    templateData = [],
    ...props
  }: Partial<
    CoverEditionScreenProps & {
      coverData: CoverData | null;
      profileKind: 'business' | 'personal';
      templateData: Array<TemplateData | null>;
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
          segmentedTemplatesCategories:
            templateData.length > 0
              ? [{ category: 'test', templates: templateData }]
              : [],
          unsegmentedTemplatesCategories:
            templateData.length > 0
              ? [{ category: 'test', templates: templateData }]
              : [],
          coverTemplatesSuggestion: templateData,
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

  const getPreviewImage = () =>
    screen.getByTestId('cover-edition-screen-cover-preview');
  const getLayer = (index: number): GPULayer =>
    screen.getByTestId('cover-edition-screen-cover-preview').props.layers[
      index
    ];

  test('Should not render ImagePicker if there is no cover, or on image picker button', () => {
    const { unmount } = renderCoverEditionScreen();
    expect(screen.queryByTestId('image-picker')).not.toBeTruthy();
    unmount();
    renderCoverEditionScreen({
      coverData: {
        sourceMedia: {
          __typename: 'MediaImage',
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
        kind: 'image',
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
        kind: 'image',
        width: 100,
        height: 100,
        editionParameters: {},
      });
    });

    expect(segmentImageMock).toHaveBeenCalledWith(
      'file:///data/fake-media.jpg',
    );
    await act(flushPromises);

    expect(getLayer(0).maskUri).not.toBe('file:///data/fake-mask.jpg');
    act(() => {
      fireEvent(screen.getAllByRole('switch')[0], 'valueChange', true);
    });
    expect(getLayer(0).maskUri).toBe('file:///data/fake-mask.jpg');

    segmentImageMock.mockResolvedValueOnce('/data/fake-mask2.jpg');
    act(() => {
      fireEvent.press(screen.getByLabelText('Select an image'));
    });
    act(() => {
      fireEvent(screen.getByTestId('image-picker'), 'finished', {
        uri: 'file:///data/fake-media2.jpg',
        kind: 'image',
        width: 100,
        height: 100,
        editionParameters: {},
      });
    });
    await act(flushPromises);

    expect(getLayer(0)).toEqual(
      expect.objectContaining({
        uri: 'file:///data/fake-media2.jpg',
        maskUri: 'file:///data/fake-mask2.jpg',
      }),
    );
  });

  const fakeTemplate: TemplateData = {
    suggested: false,
    data: {
      background: {
        id: 'coverBackgroundIdTemplate',
      },
      backgroundStyle: {
        backgroundColor: '#FFFF00',
        patternColor: '#00FFFF',
      },
      contentStyle: {
        orientation: 'topToBottom',
        placement: 'middleRight',
      },
      foreground: {
        id: 'coverForegroundIdTemplate',
      },
      foregroundStyle: {
        color: '#AAFFFF',
      },

      mediaStyle: {
        parameters: {
          brightness: 0.1,
          saturation: 0.9,
        },
        filter: 'templatefilter',
      },
      merged: false,
      segmented: true,
      subTitleStyle: {
        color: '#0A0F00',
        fontSize: 12,
        fontFamily: 'Arial',
      },
      titleStyle: {
        color: '#0400E0',
        fontSize: 12,
        fontFamily: 'Verdana',
      },
      sourceMedia: {
        id: 'sourceMediaIdTemplate',
        uri: 'http://fake-site/fake-template-media.jpg',
        width: 1200,
        height: 1920,
      },
    },
  };

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
      __typename: 'MediaImage',
      id: 'sourceMediaId',
      uri: 'http://fake-site/cover-source-media.jpg',
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

    const image = getPreviewImage();
    expect(image).toHaveStyle({ backgroundColor: '#FF0000' });
    expect(image).toHaveProp('layers', [
      expect.objectContaining({
        kind: 'image',
        uri: 'https://example.com/coverBackground2.png',
        tintColor: '#00FF00',
      }),
      expect.objectContaining({
        kind: 'image',
        uri: 'http://fake-site/cover-source-media.jpg',
        maskUri: 'http://fake-site/fake-mask.jpg',
        parameters: expect.objectContaining({
          brightness: 0.5,
        }),
        filters: ['corail'],
      }),
      expect.objectContaining({
        kind: 'image',
        uri: 'https://example.com/coverForeground3.png',
        tintColor: '#0000FF',
      }),
    ]);

    const title = screen.getByText('fake-title');
    expect(title).toHaveStyle({
      color: '#0400E0',
      fontSize: expect.any(Number),
      fontFamily: 'Verdana',
    });

    const subTitle = screen.getByText('fake-subtitle');
    expect(subTitle).toHaveStyle({
      color: '#0A0F00',
      fontSize: expect.any(Number),
      fontFamily: 'Arial',
    });
    // TODO test orientation and placement ?
  });

  test('Should activate the cropEditionMode when user click on the crop button', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    const cropper = screen.getByTestId('cropper');
    expect(cropper).toHaveProp('cropEditionMode', false);
    act(() => {
      fireEvent.press(screen.getByLabelText('Crop'));
    });
    expect(cropper).toHaveProp('cropEditionMode', true);
    act(() => {
      fireEvent(cropper, 'cropDataChange', {
        x: 0,
        y: 0,
        width: 100,
        height: 200,
      });
    });
    expect(getLayer(1).parameters).toEqual(
      expect.objectContaining({
        brightness: 0.5,
        cropData: {
          x: 0,
          y: 0,
          width: 100,
          height: 200,
        },
      }),
    );

    const rollControl = screen.getByTestId('image-edition-parameter-control');
    expect(rollControl).toHaveProp('parameter', 'roll');
    act(() => {
      fireEvent(rollControl, 'change', 20);
    });
    expect(getLayer(1).parameters).toEqual(
      expect.objectContaining({
        brightness: 0.5,
        roll: 20,
        cropData: {
          x: 0,
          y: 0,
          width: 100,
          height: 200,
        },
      }),
    );
    act(() => {
      fireEvent.press(screen.getByLabelText('Rotate'));
    });
    expect(getLayer(1).parameters).toEqual(
      expect.objectContaining({
        brightness: 0.5,
        roll: 20,
        orientation: 'RIGHT',
        cropData: {
          x: 0,
          y: 0,
          width: 100,
          height: 200,
        },
      }),
    );
    act(() => {
      fireEvent.press(screen.getByText('Cancel').parent!);
    });

    expect(cropper).toHaveProp('cropEditionMode', false);
    expect(getLayer(1).parameters).toEqual(
      expect.objectContaining({
        brightness: 0.5,
      }),
    );
  });

  test('Should activate the merge option when user toggle the merge switch', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Text'));
    });

    expect(getLayer(1).blending).not.toBe('multiply');
    act(() => {
      fireEvent(screen.getAllByRole('switch')[1], 'valueChange', true);
    });
    expect(getLayer(1).blending).toBe('multiply');
  });

  test('Should update the filter when user select a new one', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Image'));
    });

    expect(getLayer(1).filters).toEqual(['corail']);
    act(() => {
      fireEvent(screen.getByTestId('filter-selection-list'), 'change', 'sepia');
    });
    expect(getLayer(1).filters).toEqual(['sepia']);
  });

  test('Should enter in parameter edition mode when user select a parameter', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Image'));
    });

    expect(getLayer(1).parameters).toEqual(
      expect.objectContaining({
        brightness: 0.5,
      }),
    );

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
    expect(getLayer(1).parameters).toEqual(
      expect.objectContaining({
        brightness: 0.8,
      }),
    );
    act(() => {
      fireEvent.press(screen.getAllByText('Cancel')[0]);
    });
    expect(getLayer(1).parameters).toEqual(
      expect.objectContaining({
        brightness: 0.5,
      }),
    );
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
    expect(getLayer(1).parameters).toEqual(
      expect.objectContaining({
        brightness: 0.9,
      }),
    );
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
      expect(text).not.toHaveStyle({
        fontFamily: 'Helvetica',
      });
      act(() => {
        fireEvent(
          screen.getByTestId('font-dropdown-picker'),
          'fontFamilyChange',
          'Helvetica',
        );
      });
      expect(text).toHaveStyle({
        fontFamily: 'Helvetica',
      });

      // Color change tests

      expect(text).not.toHaveStyle({
        color: '#FF3322',
      });
      act(() => {
        fireEvent(
          screen.getByTestId('profile-dropdow-color-picker'),
          'colorChange',
          '#FF3322',
        );
      });
      expect(text).toHaveStyle({
        color: '#FF3322',
      });

      // font size change tests
      const previousStyle = StyleSheet.flatten(text.props.style);

      act(() => {
        fireEvent(screen.getByLabelText('Font size'), 'change', 24);
      });
      expect(text).toHaveStyle({
        fontSize: previousStyle.fontSize * 2,
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

    const foregroundPanel = screen.getByTestId('cover-foreground-panel');
    const foregroundsButtons = within(foregroundPanel).getAllByRole('button');

    expect(foregroundsButtons).toHaveLength(10);

    expect(getLayer(2).uri).not.toBe(
      'https://example.com/coverForeground7.png',
    );
    act(() => {
      fireEvent.press(foregroundsButtons[8]);
    });
    expect(getLayer(2).uri).toBe('https://example.com/coverForeground7.png');

    act(() => {
      fireEvent.press(screen.getAllByLabelText('Color')[0]);
    });

    act(() => {
      fireEvent(
        screen.getAllByTestId('profile-color-picker')[0],
        'colorChange',
        '#123456',
      );
    });
    expect(getLayer(2).tintColor).toBe('#123456');
  });

  test('Should update the background image when the user select a new one', () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
    });
    act(() => {
      fireEvent.press(screen.getByLabelText('Back.'));
    });

    const backgroundPanel = screen.getByTestId('cover-background-panel');
    const backgroundsButtons = within(backgroundPanel).getAllByRole('button');

    expect(backgroundsButtons).toHaveLength(10);

    expect(getLayer(0).uri).not.toBe(
      'https://example.com/coverBackground4.png',
    );
    act(() => {
      fireEvent.press(backgroundsButtons[5]);
    });
    expect(getLayer(0).uri).toBe('https://example.com/coverBackground4.png');

    act(() => {
      fireEvent.press(screen.getByLabelText('Color #1'));
    });

    act(() => {
      fireEvent(
        screen.getAllByTestId('profile-color-picker')[1],
        'colorChange',
        '#434239',
      );
    });
    expect(getLayer(0).tintColor).toBe('#434239');

    act(() => {
      fireEvent.press(screen.getByLabelText('Color #2'));
    });

    act(() => {
      fireEvent(
        screen.getAllByTestId('profile-color-picker')[1],
        'colorChange',
        '#FF34A2',
      );
    });
    expect(getPreviewImage()).toHaveStyle({ backgroundColor: '#FF34A2' });
  });

  test('Should allow to cancel in case of creation', () => {
    renderCoverEditionScreen();
    expect(screen.queryByText('Cancel')).toBeTruthy();
  });

  test('Button `save` should enable if the sourceMedia is empty with a personal profileKind', async () => {
    renderCoverEditionScreen({
      templateData: [{ suggested: true, data: fakeCover }],
    });
    let saveButton = screen.getByText('Save');
    while (saveButton.props.accessibilityRole !== 'button') {
      if (!saveButton.parent) {
        throw new Error('save button not found');
      }
      saveButton = saveButton.parent;
    }

    expect(saveButton).toHaveProp('accessibilityState', { disabled: false });
  });

  // in any case the save button will be enable, if suggested template, the source media is used, otherwise a alert is shown
  test('Button `save` should be enable if the sourceMedia is empty with a business profileKind and a suggested template exist', async () => {
    renderCoverEditionScreen({
      profileKind: 'business',
      templateData: [{ suggested: true, data: fakeCover }],
    });
    let saveButton = screen.getByText('Save');
    while (saveButton.props.accessibilityRole !== 'button') {
      if (!saveButton.parent) {
        throw new Error('save button not found');
      }
      saveButton = saveButton.parent;
    }

    expect(saveButton).toHaveProp('accessibilityState', { disabled: false });
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

    expect(saveButton).toHaveProp('accessibilityState', { disabled: false });
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

  test('Should select the first template, using the demo asset image if there is no cover with a personal profile', async () => {
    renderCoverEditionScreen({
      templateData: [fakeTemplate],
    });
    await act(flushPromises);
    expect(getLayer(0).uri).toEqual('http://fake-site/fake-media.jpg');
  });

  test('should not load the template is a cover already exist', async () => {
    renderCoverEditionScreen({
      coverData: fakeCover,
      templateData: [fakeTemplate],
    });
    await act(flushPromises);
    expect(getLayer(1).uri).toEqual('http://fake-site/cover-source-media.jpg');
  });

  test('should load the template definition with source media  in case of business and suggested cover exist', async () => {
    renderCoverEditionScreen({
      profileKind: 'business',
      coverData: null,
      templateData: [{ ...fakeTemplate, suggested: true }],
    });
    await act(flushPromises);
    expect(getLayer(0)).toMatchObject({
      kind: 'image',
      uri: 'http://fake-site/fake-template-media.jpg',
      maskUri: undefined,
      parameters: { brightness: 0.1, saturation: 0.9, cropData: undefined },
      filters: ['templatefilter'],
      blending: 'none',
    });
  });

  xtest('Should save the cover', () => {
    // TODO implement this test once the save is implemented in production mode
  });
});
