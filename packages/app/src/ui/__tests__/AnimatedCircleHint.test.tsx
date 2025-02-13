import { render } from '@testing-library/react-native';

import { Animated, Easing } from 'react-native';
import AnimatedCircleHint from '../AnimatedCircleHint';

describe('Animated Circle Hint component', () => {
  test('renders correctly with provided props', () => {
    const { queryByTestId } = render(
      <AnimatedCircleHint
        testID="animated-circle"
        animating
        duration={1000}
        easing={Easing.linear}
        hidesWhenStopped
      >
        <Animated.View testID="child-view" />
      </AnimatedCircleHint>,
    );
    expect(queryByTestId('animated-circle')).toBeTruthy();
    expect(queryByTestId('child-view')).toBeTruthy();
  });

  test('renders null when hidesWhenStopped prop is true and animating prop is false', () => {
    const { queryByTestId } = render(
      <AnimatedCircleHint
        testID="animated-circle"
        animating={false}
        duration={1000}
        easing={Easing.linear}
        hidesWhenStopped
      >
        <Animated.View testID="child-view" />
      </AnimatedCircleHint>,
    );
    expect(queryByTestId('animated-circle')).toBeFalsy();
  });
});
