import { render, screen } from '@testing-library/react-native';
import { RichText } from '../RichText';

describe('RichText ui component', () => {
  test('simple snapshot', () => {
    render(<RichText text="abc" fontSize={10} />);
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
      <RichText text="abc" style={{ textAlign: 'center' }} fontSize={20} />,
    );
    expect(screen.toJSON()).toMatchInlineSnapshot(`
      <Text
        style={
          {
            "textAlign": "center",
          }
        }
      >
        <Text
          style={
            [
              {
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
    render(<RichText text="<b>abc</b>" fontSize={10} />);
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
    const component = render(<RichText text="<b>abc</b>" fontSize={10} />);
    component.rerender(<RichText text="<b>abc</b>c" fontSize={10} />);
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
    const component = render(<RichText text="<b>abc</b>" fontSize={10} />);
    component.rerender(<RichText text="<b>ab</b>" fontSize={10} />);
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
    const component = render(<RichText text="<b>abc</b>" fontSize={10} />);
    component.rerender(<RichText text="" fontSize={10} />);
    expect(screen.toJSON()).toMatchInlineSnapshot(`
      <Text
        style={{}}
      />
    `);
  });
});
