import { colors } from '#theme';
import { fireEvent, render, screen } from '#helpers/testHelpers';

import ProgressBar from '../ProgressBar';

describe('ProgressBar component', () => {
  test('should apply `style` props correctly', () => {
    const { root } = render(
      <ProgressBar
        style={{ backgroundColor: colors.red400, width: 345 }}
        progress={0}
      />,
    );

    expect(root).toHaveStyle({
      backgroundColor: colors.red400,
      width: 345,
    });
  });

  //could not make it work using reanimated mock
  test('should `progress` props size the bar correctly', async () => {
    jest.useFakeTimers();
    render(
      <ProgressBar
        style={{ backgroundColor: colors.red400, width: 345 }}
        progress={0.49}
      />,
    );
    // there is a bug coupliing onLayout and useAnimatedStyle (force the default value in code)
    fireEvent(screen.getByTestId('progress-bar-container'), 'layout', {
      nativeEvent: { layout: { width: 300, height: 3 } },
    });

    jest.runAllTimers();

    expect(screen.getByTestId('progressbar')).toHaveStyle({
      width: 147,
    });
  });
});
