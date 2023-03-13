import '@testing-library/jest-native/extend-expect';

import { act, fireEvent, render, screen } from '#helpers/testHelpers';

import OnBoardingType from '../OnBoardingType';

describe('OnBoardingType component', () => {
  test('Button Continue should be disabled if profileKind is not selected', () => {
    render(
      <OnBoardingType
        next={jest.fn}
        profileKind={undefined}
        setProfileKind={jest.fn}
      />,
    );

    expect(
      screen.queryByTestId('azzapp_Button_pressable-wrapper'),
    ).toBeDisabled();
  });

  test('Button Continue should be enabled if profileKind is defined from props', () => {
    const mockSetContet = jest.fn();
    render(
      <OnBoardingType
        next={jest.fn}
        profileKind={'personal'}
        setProfileKind={mockSetContet}
      />,
    );

    expect(
      screen.queryByTestId('azzapp_Button_pressable-wrapper'),
    ).toBeEnabled();
  });

  test('Button Continue should be enabled if profileKind is selected from form', () => {
    const mockSetContet = jest.fn();
    render(
      <OnBoardingType
        next={jest.fn}
        profileKind={'personal'}
        setProfileKind={mockSetContet}
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
    expect(mockSetContet).toHaveBeenCalledWith('personal');
  });

  test('should call `setProfileKind` callback when selecting profileKind ', () => {
    const mockSetContet = jest.fn();
    render(
      <OnBoardingType
        next={jest.fn}
        profileKind={'personal'}
        setProfileKind={mockSetContet}
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
    expect(mockSetContet).toHaveBeenCalledWith('personal');
  });

  test('Button Continue should call `next` callback', () => {
    const mockNext = jest.fn();
    render(
      <OnBoardingType
        next={mockNext}
        profileKind={'personal'}
        setProfileKind={jest.fn}
      />,
    );

    act(() =>
      fireEvent(
        screen.getByTestId('azzapp_Button_pressable-wrapper'),
        'onPress',
      ),
    );
    expect(mockNext).toHaveBeenCalled();
  });
});
