import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

import { colors } from '#theme';
import OnBoardingPager from '../OnBoardingPager';

describe('OnBoardingPager component', () => {
  test('should render without error with outofbound active index', () => {
    render(<OnBoardingPager activeIndex={-1} />);

    expect(screen.queryByAccessibilityState({ selected: true })).toBeNull();
  });

  test('should render with the correct selected index with correct width', () => {
    render(<OnBoardingPager activeIndex={1} />);

    expect(screen.queryByAccessibilityState({ selected: true })).toBeTruthy();
    expect(screen.queryByAccessibilityState({ selected: true })).toHaveStyle({
      width: 20,
      backgroundColor: colors.red400,
    });
  });
});
