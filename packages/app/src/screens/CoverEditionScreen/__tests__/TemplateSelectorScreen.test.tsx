import '@testing-library/jest-native/extend-expect';

import {
  RelayEnvironmentProvider,
  graphql,
  useLazyLoadQuery,
} from 'react-relay';
import { MockPayloadGenerator } from 'relay-test-utils';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { act, render, screen, fireEvent } from '#helpers/testHelpers';

import TemplateSelectorScreen from '../TemplateSelectorScreen';
import type { TemplateSelectorScreenProps } from '../TemplateSelectorScreen';
import type { TemplateSelectorScreenTestQuery } from '@azzapp/relay/artifacts/TemplateSelectorScreenTestQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

jest.mock('#screens/CoverEditionScreen/CoverPreviewRenderer', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const CoverEditionScreenCoverRenderer = (props: any) =>
    React.createElement('CoverPreviewRenderer', {
      ...props,
      testID: 'cover-preview',
    });
  return {
    __esModule: true,
    default: CoverEditionScreenCoverRenderer,
  };
});

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('#PlatformEnvironment', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  return {
    useRouter() {
      return mockRouter;
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

const TEMPLATE_COVER_DATA = {
  id: '<CoverTemplate-mock-id-1>',
  colorPalette: ['#233423'],
  tags: ['tags'],
  data: {
    segmented: false,
    merged: false,
    background: null,
    backgroundStyle: null,
    foreground: null,
    foregroundStyle: null,
    title: 'Template title',
    contentStyle: null,
    titleStyle: null,
    subTitleStyle: null,
    subTitle: 'Template subTitle',
    mediaStyle: null,
    sourceMedia: {
      id: 'sourceMediaId',
      uri: 'https://example.com/sourceMedia.png',
      width: 100,
      height: 100,
    },
  },
};

describe('TemplateSelectorScreen component', () => {
  let environement: RelayMockEnvironment;

  const renderTemplateSelector = () => {
    environement = createMockEnvironment();
    environement.mock.queueOperationResolver(operation =>
      MockPayloadGenerator.generate(operation, {
        Viewer: () => ({
          profile: {
            id: 'profileId',
            colorPalette: ['#FFFFFF'],
          },
          coverTemplates: [TEMPLATE_COVER_DATA],
        }),
      }),
    );

    const TestRenderer = (props?: Partial<TemplateSelectorScreenProps>) => {
      const data = useLazyLoadQuery<TemplateSelectorScreenTestQuery>(
        graphql`
          query TemplateSelectorScreenTestQuery @relay_test_operation {
            viewer {
              ...TemplateSelectorScreen_viewer
            }
          }
        `,
        {},
      );
      return <TemplateSelectorScreen viewer={data.viewer} {...props} />;
    };

    return render(
      <RelayEnvironmentProvider environment={environement}>
        <TestRenderer />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should render the flatlist correctly with one cover template', () => {
    renderTemplateSelector();
    expect(screen.getByRole('list')).toBeTruthy();
    expect(screen.getAllByTestId('cover-preview')).toHaveLength(1);
  });

  test('Should call the router with `templateId`  navigation params when selecting a template', () => {
    renderTemplateSelector();
    const allLink = screen.getAllByRole('button');

    act(() => {
      fireEvent.press(allLink[0]);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          templateId: '<CoverTemplate-mock-id-1>',
        }),
      }),
    );
  });

  test('Should call the router without `temaplteId` navigation params when "create from scratch button" is clicked', () => {
    renderTemplateSelector();
    const button = screen.getByTestId('create-from-scratch-button');

    act(() => {
      fireEvent.press(button);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.not.objectContaining({
          templateId: '<CoverTemplate-mock-id-1>',
        }),
      }),
    );
  });

  test('Should call the router without `tempalteId`and `useTemplateSourceMedia` = true  avigation params when selecting a template with a business profile kind', () => {
    renderTemplateSelector();
    const allLink = screen.getAllByRole('link');

    act(() => {
      fireEvent.press(allLink[0]);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          templateId: '<CoverTemplate-mock-id-1>',
        }),
      }),
    );
  });
});
