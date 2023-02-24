import { act, fireEvent, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { COVER_BASE_WIDTH } from '@azzapp/shared/lib/cardHelpers';
import { render } from '../../../utils/test-util';
import CoverRenderer from '../CoverRenderer';
import type { CoverRendererProps } from '../CoverRenderer';
import type { CoverRendererTestQuery } from '@azzapp/relay/artifacts/CoverRendererTestQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

jest.mock('@azzapp/relay/providers/isNative.relayprovider', () => ({
  get() {
    return true;
  },
}));

let environement: RelayMockEnvironment;

const renderCover = (props?: Partial<CoverRendererProps>) => {
  environement = createMockEnvironment();
  environement.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      Card: () => ({
        id: 'test_id',
        cover: {
          media: {
            id: 'media_id',
            largeURI: 'media_large_uri',
            smallURI: 'media_small_uri',
          },
          textPreviewMedia: {
            id: 'text_preview_media_id',
            largeURI: 'text_preview_large_uri',
            smallURI: 'text_preview_small_uri',
          },
          title: 'User card title',
          subTitle: 'User card subtitle',
        },
      }),
    }),
  );
  const TestRenderer = (props?: Partial<CoverRendererProps>) => {
    const data = useLazyLoadQuery<CoverRendererTestQuery>(
      graphql`
        query CoverRendererTestQuery @relay_test_operation {
          card: node(id: "test_id") {
            ... on Card {
              #usefull to update the card during the test
              id
              cover {
                ...CoverRenderer_cover
              }
            }
          }
        }
      `,
      {},
    );
    return (
      <CoverRenderer
        cover={data.card?.cover}
        width={COVER_BASE_WIDTH}
        userName="userName"
        {...props}
      />
    );
  };
  const component = render(
    <RelayEnvironmentProvider environment={environement}>
      <TestRenderer {...props} />
    </RelayEnvironmentProvider>,
  );

  return {
    ...component,
    rerender(updates?: Partial<CoverRendererProps>) {
      component.rerender(
        <RelayEnvironmentProvider environment={environement}>
          <TestRenderer {...props} {...updates} />
        </RelayEnvironmentProvider>,
      );
    },
  };
};

describe('CoverRenderer', () => {
  test('should render the cover media and the text overlay media', () => {
    renderCover();

    const images = screen.getAllByRole('image');
    // 2 images: the cover media and the text overlay media + the qr code image button
    expect(images.length).toBe(3);

    expect(images[0]).toHaveProp(
      'accessibilityLabel',
      'User card title - User card subtitle - background image',
    );

    expect(images[1]).toHaveProp(
      'accessibilityLabel',
      'User card title - User card subtitle',
    );
  });

  test(
    'image should display the small version of the medias ' +
      'if width is the cover base width, and the large version otherwise',
    () => {
      const { rerender } = renderCover();
      const images = screen.getAllByRole('image');
      expect(images[0]).toHaveProp('source', {
        mediaID: 'media_id',
        requestedSize: 125,
        uri: 'media_small_uri',
      });
      expect(images[1]).toHaveProp('source', {
        mediaID: 'text_preview_media_id',
        requestedSize: 125,
        uri: 'text_preview_small_uri',
      });

      rerender({ width: COVER_BASE_WIDTH * 2 });
      expect(images[0]).toHaveProp('source', {
        mediaID: 'media_id',
        requestedSize: 250,
        uri: 'media_large_uri',
      });
      expect(images[1]).toHaveProp('source', {
        mediaID: 'text_preview_media_id',
        requestedSize: 250,
        uri: 'text_preview_large_uri',
      });
    },
  );

  test('should dispatch onReadyForDisplay when both medias are ready', () => {
    const onReadyForDisplayMock = jest.fn();
    renderCover({ onReadyForDisplay: onReadyForDisplayMock });

    expect(onReadyForDisplayMock).not.toHaveBeenCalled();
    const images = screen.getAllByRole('image');
    act(() => {
      fireEvent(images[0], 'onReadyForDisplay');
    });
    expect(onReadyForDisplayMock).not.toHaveBeenCalled();
    act(() => {
      fireEvent(images[1], 'onReadyForDisplay');
    });
    expect(onReadyForDisplayMock).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent(images[1], 'onReadyForDisplay');
    });
    expect(onReadyForDisplayMock).toHaveBeenCalledTimes(2);

    act(() => {
      environement.commitUpdate(store => {
        const newMedia = store.create('media_id1', 'MediaImage');
        const card = store.get('test_id');
        card?.getLinkedRecord('cover')?.setLinkedRecord(newMedia, 'media');
      });
    });

    act(() => {
      fireEvent(images[1], 'onReadyForDisplay');
    });
    expect(onReadyForDisplayMock).toHaveBeenCalledTimes(2);

    act(() => {
      fireEvent(images[0], 'onReadyForDisplay');
    });
    expect(onReadyForDisplayMock).toHaveBeenCalledTimes(3);
  });

  test('should render a qr code button that display a modal when pressed', () => {
    renderCover();

    const button = screen.getByLabelText(
      'Tap me to show the QR Code fullscreen',
    );
    expect(screen.queryByTestId('qr-code-modal')).toBeNull();

    act(() => {
      fireEvent.press(button);
    });
    expect(screen.getByTestId('qr-code-modal')).toBeVisible();
  });
});
