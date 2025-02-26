import { render, screen } from '@testing-library/react-native';
import { RichText } from '../RichText';

describe('RichText ui component', () => {
  test('simple snapshot', () => {
    render(<RichText text="abc" />);
    expect(screen.toJSON()).toMatchInlineSnapshot(`
      <Text
        style={{}}
      >
        <Text
          style={
            [
              {},
              {},
            ]
          }
        >
          abc
        </Text>
      </Text>
    `);
  });
  test('simple snapshot with styles', () => {
    render(
      <RichText
        text="abc"
        style={[{ fontSize: 20 }, { textAlign: 'center' }]}
      />,
    );
    expect(screen.toJSON()).toMatchInlineSnapshot(`
      <Text
        style={
          [
            {
              "fontSize": 20,
            },
            {
              "textAlign": "center",
            },
          ]
        }
      >
        <Text
          style={
            [
              {
                "fontSize": 20,
                "textAlign": "center",
              },
              {},
            ]
          }
        >
          abc
        </Text>
      </Text>
    `);
  });

  test('simple snapshot with bold', () => {
    render(<RichText text="<b>abc</b>" />);
    expect(screen.toJSON()).toMatchInlineSnapshot(`
      <Text
        style={{}}
      >
        <Text
          style={
            [
              {},
              {
                "fontWeight": "bold",
              },
            ]
          }
        >
          abc
        </Text>
      </Text>
    `);
  });
  test('snapshot after append text', async () => {
    const component = render(<RichText text="<b>abc</b>" />);
    component.rerender(<RichText text="<b>abc</b>c" />);
    expect(screen.toJSON()).toMatchInlineSnapshot(`
      <Text
        style={{}}
      >
        <Text
          style={
            [
              {},
              {
                "fontWeight": "bold",
              },
            ]
          }
        >
          abc
        </Text>
        <Text
          style={
            [
              {},
              {},
            ]
          }
        >
          c
        </Text>
      </Text>
    `);
  });

  test('snapshot after remove text', async () => {
    const component = render(<RichText text="<b>abc</b>" />);
    component.rerender(<RichText text="<b>ab</b>" />);
    expect(screen.toJSON()).toMatchInlineSnapshot(`
      <Text
        style={{}}
      >
        <Text
          style={
            [
              {},
              {
                "fontWeight": "bold",
              },
            ]
          }
        >
          ab
        </Text>
      </Text>
    `);
  });

  test('snapshot after clean text', async () => {
    const component = render(<RichText text="<b>abc</b>" />);
    component.rerender(<RichText text="" />);
    expect(screen.toJSON()).toMatchInlineSnapshot(`
      <Text
        style={{}}
      />
    `);
  });
});
