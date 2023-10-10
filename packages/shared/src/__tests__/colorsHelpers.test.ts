import { colors, getTextColor } from '../colorsHelpers';

describe('getTextColor', () => {
  it('should return black for a light background color', () => {
    const backgroundColor = '#FFFFFF'; // white
    const textColor = getTextColor(backgroundColor);
    expect(textColor).toEqual(colors.black); // black
  });

  it('should return white for a dark background color', () => {
    const backgroundColor = '#000000'; // black
    const textColor = getTextColor(backgroundColor);
    expect(textColor).toEqual(colors.white); // white
  });

  it('should return black for a medium-light background color', () => {
    const backgroundColor = '#CCCCCC'; // light gray
    const textColor = getTextColor(backgroundColor);
    expect(textColor).toEqual(colors.black); // black
  });

  it('should return white for a medium-dark background color', () => {
    const backgroundColor = '#333333'; // dark gray
    const textColor = getTextColor(backgroundColor);
    expect(textColor).toEqual(colors.white); // white
  });
});
