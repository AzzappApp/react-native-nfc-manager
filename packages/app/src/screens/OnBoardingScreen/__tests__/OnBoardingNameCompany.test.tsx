import '@testing-library/jest-native/extend-expect';

import { act, fireEvent, render, screen } from '#utils/test-util';

import OnBoardingNameCompany from '../OnBoardingNameCompany';

describe('OnBoardingNameCompany component', () => {
  test('Button `Continue` should be disabled if `companyName` and `companyActivityId` are not filled', () => {
    render(
      <OnBoardingNameCompany
        next={jest.fn}
        prev={jest.fn}
        setCompanyName={jest.fn}
        setCompanyActivityId={jest.fn}
        companyActivityId=""
        companyName=""
      />,
    );
    const allButtons = screen.queryAllByRole('button');
    expect(allButtons[allButtons.length - 1]).toBeDisabled();
  });

  test('Button `Continue` should be disabled if `companyName` is not filled', () => {
    render(
      <OnBoardingNameCompany
        next={jest.fn}
        prev={jest.fn}
        setCompanyName={jest.fn}
        setCompanyActivityId={jest.fn}
        companyActivityId="activity1"
        companyName=""
      />,
    );
    const allButtons = screen.queryAllByRole('button');
    expect(allButtons[allButtons.length - 1]).toBeDisabled();
  });

  test('Button `Continue` should be disabled if `companyActivityId` is not filled', () => {
    render(
      <OnBoardingNameCompany
        next={jest.fn}
        prev={jest.fn}
        setCompanyName={jest.fn}
        setCompanyActivityId={jest.fn}
        companyActivityId=""
        companyName="companyName"
      />,
    );
    const allButtons = screen.queryAllByRole('button');
    expect(allButtons[allButtons.length - 1]).toBeDisabled();
  });

  test('Button `Continue` should be enable if `companyName` and `companyActivityId` are filled', () => {
    render(
      <OnBoardingNameCompany
        next={jest.fn}
        prev={jest.fn}
        setCompanyName={jest.fn}
        setCompanyActivityId={jest.fn}
        companyActivityId="activityID"
        companyName="companyName"
      />,
    );
    const allButtons = screen.queryAllByRole('button');
    expect(allButtons[allButtons.length - 1]).toBeEnabled();
  });

  test('should called `next` callback on press Button `Continue`', () => {
    const mockFn = jest.fn();
    render(
      <OnBoardingNameCompany
        next={mockFn}
        prev={jest.fn}
        setCompanyName={jest.fn}
        setCompanyActivityId={jest.fn}
        companyActivityId="activityID"
        companyName="companyName"
      />,
    );
    const allButtons = screen.queryAllByRole('button');
    act(() => fireEvent.press(allButtons[allButtons.length - 1]));
    expect(mockFn).toHaveBeenCalled();
  });

  test('should called `prev` callback on press icon button previous', () => {
    const mockFn = jest.fn();
    render(
      <OnBoardingNameCompany
        next={jest.fn}
        prev={mockFn}
        setCompanyName={jest.fn}
        setCompanyActivityId={jest.fn}
        companyActivityId="activityID"
        companyName="companyName"
      />,
    );
    const allButtons = screen.queryAllByRole('button');
    act(() => fireEvent.press(allButtons[0]));
    expect(mockFn).toHaveBeenCalled();
  });

  test('should called `setCompanyName` callback when entering company name', () => {
    const mockFn = jest.fn();
    render(
      <OnBoardingNameCompany
        next={jest.fn}
        prev={jest.fn}
        setCompanyName={mockFn}
        setCompanyActivityId={jest.fn}
        companyActivityId="activityID"
        companyName="companyName"
      />,
    );
    const inputName = screen.queryByPlaceholderText('Enter your company name');

    act(() => fireEvent(inputName, 'onChangeText', 'Compan name'));
    expect(mockFn).toHaveBeenCalled();
  });
});
