import '@testing-library/jest-native/extend-expect';

import { act, fireEvent, render, screen } from '../../../../utils/test-util';

import OnBoardingType from '../OnBoardingType';

describe('OnBoardingType component', () => {
  test('Button Continue should be disabled if userType is not selected', () => {
    render(
      <OnBoardingType
        next={jest.fn}
        userType={undefined}
        setUserType={jest.fn}
      />,
    );

    expect(
      screen.queryByTestId('azzapp_Button_pressable-wrapper'),
    ).toBeDisabled();
  });

  test('Button Continue should be enabled if userType is defined from props', () => {
    const mockSetContet = jest.fn();
    render(
      <OnBoardingType
        next={jest.fn}
        userType={'PERSONAL'}
        setUserType={mockSetContet}
      />,
    );

    expect(
      screen.queryByTestId('azzapp_Button_pressable-wrapper'),
    ).toBeEnabled();
  });

  test('Button Continue should be enabled if userType is selected from form', () => {
    const mockSetContet = jest.fn();
    render(
      <OnBoardingType
        next={jest.fn}
        userType={'PERSONAL'}
        setUserType={mockSetContet}
      />,
    );

    act(() => {
      fireEvent.press(
        screen.queryAllByTestId('azzapp_TagCategory_pressable-wrapper')[0],
      );
    });

    expect(
      screen.queryByTestId('azzapp_Button_pressable-wrapper'),
    ).toBeEnabled();
    expect(mockSetContet).toHaveBeenCalledWith('PERSONAL');
  });

  test('should call `setUserType` callback when selecting userType ', () => {
    const mockSetContet = jest.fn();
    render(
      <OnBoardingType
        next={jest.fn}
        userType={'PERSONAL'}
        setUserType={mockSetContet}
      />,
    );

    act(() => {
      fireEvent.press(
        screen.queryAllByTestId('azzapp_TagCategory_pressable-wrapper')[0],
      );
    });

    expect(
      screen.queryByTestId('azzapp_Button_pressable-wrapper'),
    ).toBeEnabled();
    expect(mockSetContet).toHaveBeenCalledWith('PERSONAL');
  });

  test('Button Continue should call `next` callback', () => {
    const mockNext = jest.fn();
    render(
      <OnBoardingType
        next={mockNext}
        userType={'PERSONAL'}
        setUserType={jest.fn}
      />,
    );

    act(() =>
      fireEvent(
        screen.queryByTestId('azzapp_Button_pressable-wrapper'),
        'onPress',
      ),
    );
    expect(mockNext).toHaveBeenCalled();
  });
});
