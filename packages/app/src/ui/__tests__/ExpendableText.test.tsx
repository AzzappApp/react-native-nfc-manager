import { act, fireEvent, render } from '#helpers/testHelpers';
import ExpendableText from '../ExpendableText';

describe('ExpendableText', () => {
  test('renders label without option to expand', () => {
    const { getByText } = render(
      <ExpendableText label="Hello World" numberOfLines={3} />,
    );
    const labelElement = getByText('Hello World');
    expect(labelElement).toBeDefined();
  });

  test('text should be clipped if exceeding the numbeOfLines', async () => {
    jest.useFakeTimers();
    const { getByTestId } = render(
      <ExpendableText label={lorem} numberOfLines={3} testID="clippedTextId" />,
    );
    const textComponent = getByTestId('clippedTextId');
    act(() => {
      fireEvent(textComponent, 'onTextLayout', {
        nativeEvent: {
          lines: loremTextLayoutEvent,
        },
      });
    });
    jest.runAllTimers();

    expect(textComponent).toHaveTextContent(
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took ... more",
    );
  });

  test('should extend text on touch', () => {
    const { getByTestId } = render(
      <ExpendableText label={lorem} numberOfLines={3} testID="clippedTextId" />,
    );
    const textComponent = getByTestId('clippedTextId');
    act(() => {
      fireEvent(textComponent, 'onTextLayout', {
        nativeEvent: {
          lines: loremTextLayoutEvent,
        },
      });
    });

    fireEvent.press(textComponent);
    expect(textComponent).toHaveTextContent(lorem);
  });
});

const lorem =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

const loremTextLayoutEvent = [
  {
    ascender: 11.42578125,
    capHeight: 8.455078125,
    descender: 2.89453125,
    height: 14.3203125,
    text: 'Lorem Ipsum is simply dummy text of the printing and typesetting ',
    width: 373,
    x: 0,
    xHeight: 6.31640625,
    y: 0,
  },
  {
    ascender: 11.42578125,
    capHeight: 8.455078125,
    descender: 2.89453125,
    height: 14.3203125,
    text: "industry. Lorem Ipsum has been the industry's standard dummy ",
    width: 362.419921875,
    x: 0,
    xHeight: 6.31640625,
    y: 14.3203125,
  },
  {
    ascender: 11.42578125,
    capHeight: 8.455078125,
    descender: 2.89453125,
    height: 14.3203125,
    text: 'text ever since the 1500s, when an unknown printer took a galley ',
    width: 369.427734375,
    x: 0,
    xHeight: 6.31640625,
    y: 28.640625,
  },
  {
    ascender: 11.42578125,
    capHeight: 8.455078125,
    descender: 2.89453125,
    height: 14.3203125,
    text: 'of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
    width: 370.658203125,
    x: 0,
    xHeight: 6.31640625,
    y: 42.9609375,
  },
];
