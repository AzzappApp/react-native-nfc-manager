import '@testing-library/jest-native/extend-expect';

import { act, fireEvent, render, screen } from '../../../../utils/test-util';

import OnBoardingName from '../OnBoardingName';

describe('OnBoardingName component', () => {
  test('Button `Continue` should be disabled if `firstname` and `lastname` are not filled', () => {
    render(
      <OnBoardingName
        firstName=""
        lastName=""
        setFirstName={jest.fn}
        setLastName={jest.fn}
        next={jest.fn}
        prev={jest.fn}
      />,
    );
    expect(screen.queryAllByRole('button')[1]).toBeDisabled();
  });

  test('Button continue should be disabled if `firstname` is not filled', () => {
    render(
      <OnBoardingName
        firstName=""
        lastName=""
        setFirstName={jest.fn}
        setLastName={jest.fn}
        next={jest.fn}
        prev={jest.fn}
      />,
    );
    const inputName = screen.queryByPlaceholderText('Enter your last name');
    act(() => fireEvent(inputName, 'onChangeText', 'myTestUserName'));
    expect(screen.queryAllByRole('button')[1]).toBeDisabled();
  });

  test('Button continue should be disabled if `lastname` is not filled', () => {
    render(
      <OnBoardingName
        firstName=""
        lastName=""
        setFirstName={jest.fn}
        setLastName={jest.fn}
        next={jest.fn}
        prev={jest.fn}
      />,
    );
    const lastName = screen.queryByPlaceholderText('Enter your first name');
    act(() => fireEvent(lastName, 'onChangeText', 'myTestUserName'));
    expect(screen.queryAllByRole('button')[1]).toBeDisabled();
  });

  test('Button continue should be enabled if all fields are filled', () => {
    render(
      <OnBoardingName
        firstName="name"
        lastName="toto"
        setFirstName={jest.fn}
        setLastName={jest.fn}
        next={jest.fn}
        prev={jest.fn}
      />,
    );
    expect(screen.queryAllByRole('button')[1]).toBeEnabled();
  });

  test('Pressing button continue should call `next` method', () => {
    const mockNext = jest.fn();
    render(
      <OnBoardingName
        firstName="name"
        lastName="toto"
        setFirstName={jest.fn}
        setLastName={jest.fn}
        next={mockNext}
        prev={jest.fn}
      />,
    );
    act(() => fireEvent(screen.queryAllByRole('button')[1], 'onPress'));
    expect(mockNext).toHaveBeenCalled();
  });

  test('shoud call `setFirstName` callback when entering the `firstname`', () => {
    const mockContext = jest.fn();
    render(
      <OnBoardingName
        firstName="name"
        lastName="toto"
        setFirstName={mockContext}
        setLastName={jest.fn}
        next={jest.fn}
        prev={jest.fn}
      />,
    );
    const lastName = screen.queryByPlaceholderText('Enter your first name');
    act(() => fireEvent(lastName, 'onChangeText', 'myTestUserName'));

    expect(mockContext).toHaveBeenCalled();
  });

  test('shoud call `setLastName` callback when entering the `lastname`', () => {
    const mockContext = jest.fn();
    render(
      <OnBoardingName
        firstName="name"
        lastName="toto"
        setFirstName={jest.fn}
        setLastName={mockContext}
        next={jest.fn}
        prev={jest.fn}
      />,
    );
    const lastName = screen.queryByPlaceholderText('Enter your last name');
    act(() => fireEvent(lastName, 'onChangeText', 'myTestUserName'));

    expect(mockContext).toHaveBeenCalled();
  });

  test('shoud call `next` method when pressing button Continue', () => {
    const mockNext = jest.fn();
    render(
      <OnBoardingName
        firstName="name"
        lastName="toto"
        setFirstName={jest.fn}
        setLastName={jest.fn}
        prev={jest.fn}
        next={mockNext}
      />,
    );

    act(() => fireEvent.press(screen.queryAllByRole('button')[1]));
    expect(mockNext).toHaveBeenCalled();
  });
});
