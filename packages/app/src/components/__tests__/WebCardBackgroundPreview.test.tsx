import { render } from '@testing-library/react-native';
import React from 'react';
import { useFragment } from 'react-relay';
import WebCardBackgroundPreview from '../WebCardBackgroundPreview'; // Adjust import as needed
import type { WebCardBackgroundPreview_webCard$key } from '#relayArtifacts/WebCardBackgroundPreview_webCard.graphql';

// Mock GraphQL Fragment (Relay)
jest.mock('react-relay', () => ({
  graphql: jest.fn(),
  useFragment: jest.fn(),
}));

const defaultFragment = {
  cardColors: { light: '#ffffff', dark: '#000000', primary: '#ff0000' },
  coverBackgroundColor: 'primary',
  cardStyle: {
    borderColor: '#ccc',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'Arial',
  },
  cardModules: [],
};

describe('WebCardBackgroundPreview Component', () => {
  it('renders with correct background colors', () => {
    // Mock fragment data
    (useFragment as jest.Mock).mockReturnValue({
      ...defaultFragment,
      cardModules: [
        { kind: 'media', cardModuleColor: { background: '#00ff00' } },
      ],
    });

    const { getByTestId } = render(
      <WebCardBackgroundPreview
        webCard={{} as WebCardBackgroundPreview_webCard$key}
      />,
    );

    // Check first background color
    const firstColorView = getByTestId('WebCardBackgroundPreviewFirstColor');
    expect(firstColorView.props.style.backgroundColor).toBe('#ff0000'); // primary color

    // Check last module color
    const lastColorView = getByTestId('WebCardBackgroundPreviewLastColor');
    expect(lastColorView.props.style.backgroundColor).toBe('#00ff00'); // last module background color
  });

  it('renders with correct background colors', () => {
    // Mock fragment data
    (useFragment as jest.Mock).mockReturnValue({
      ...defaultFragment,
      cardModules: [
        { kind: 'titleText', cardModuleColor: { background: '#00ff00' } },
      ],
    });

    const { getByTestId } = render(
      <WebCardBackgroundPreview
        webCard={{} as WebCardBackgroundPreview_webCard$key}
      />,
    );

    // Check first background color
    const firstColorView = getByTestId('WebCardBackgroundPreviewFirstColor');
    expect(firstColorView.props.style.backgroundColor).toBe('#ff0000'); // primary color

    // Check last module color
    const lastColorView = getByTestId('WebCardBackgroundPreviewLastColor');
    expect(lastColorView.props.style.backgroundColor).toBe('#00ff00'); // last module background color
  });

  it('don t warns when last module has no cardModule', () => {
    console.warn = jest.fn(); // Mock console.warn
    (useFragment as jest.Mock).mockReturnValue(defaultFragment);
    render(
      <WebCardBackgroundPreview
        webCard={{} as WebCardBackgroundPreview_webCard$key}
      />,
    );
    expect(console.warn).not.toHaveBeenCalledWith(
      'Error no cardModuleColor defined for your module, You have an issue here',
    );
  });
  it('warns when last module has no cardModuleColor', () => {
    console.warn = jest.fn(); // Mock console.warn
    (useFragment as jest.Mock).mockReturnValue({
      ...defaultFragment,
      cardModules: [{ kind: 'titleText' }],
    });
    render(
      <WebCardBackgroundPreview
        webCard={{} as WebCardBackgroundPreview_webCard$key}
      />,
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Error no cardModuleColor defined for your module, You have an issue here',
    );
  });
});
