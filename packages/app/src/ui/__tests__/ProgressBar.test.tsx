import { render, screen } from '@testing-library/react-native';
import ProgressBar from '../ProgressBar';

describe('ProgressBar component', () => {
  test('should apply `style` props correctly', () => {
    const { root } = render(
      <ProgressBar
        style={{ backgroundColor: 'red', width: 345 }}
        progress={0}
      />,
    );

    expect(root).toHaveStyle({
      backgroundColor: 'red',
      width: 345,
    });
  });

  test('should `progress` props size the bar correctly', () => {
    render(
      <ProgressBar
        style={{ backgroundColor: 'red', width: 345 }}
        progress={0.49}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '49%' });
  });
});
