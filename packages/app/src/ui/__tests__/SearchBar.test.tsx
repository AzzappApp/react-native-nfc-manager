import { act, fireEvent, render, screen } from '#helpers/testHelpers';

import SearchBar from '../SearchBar';

const placeholder = 'placeholder';
const onChangeText = jest.fn();
const onBlur = jest.fn();
const onCancel = jest.fn();
const onClear = jest.fn();
const onFocus = jest.fn();
const searchText = 'some text';

describe('SearchBar component', () => {
  jest.useFakeTimers();
  beforeEach(() => {
    onChangeText.mockReset();
    onBlur.mockReset();
    onCancel.mockReset();
    onFocus.mockReset();
  });

  test('should call `onFocus` when touching the input', () => {
    render(
      <SearchBar
        placeholder={placeholder}
        onChangeText={onChangeText}
        onFocus={onFocus}
      />,
    );

    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__SearchBar__container-view'),
        'layout',
        {
          nativeEvent: { layout: { width: 450, height: 100 } },
        },
      );
    });

    fireEvent(screen.getByTestId('azzapp__searchbar__textInput'), 'focus');
    expect(onFocus).toHaveBeenCalled();
  });

  test('should call `onChangeText` with undefined param when touching the clear button', () => {
    render(
      <SearchBar
        placeholder={placeholder}
        onChangeText={onChangeText}
        value="searchText"
        onCancel={onCancel}
      />,
    );

    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__SearchBar__container-view'),
        'layout',
        {
          nativeEvent: { layout: { width: 450, height: 100 } },
        },
      );
    });
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__searchbar__textInput'),
        'onChangeText',
        searchText,
      );
    });
    act(() => {
      fireEvent(screen.getByTestId('azzapp__SearchBar__clear-button'), 'press');
    });
    expect(onCancel).not.toHaveBeenCalled();
    expect(onChangeText).toHaveBeenCalledTimes(2);
    expect(onChangeText).toHaveBeenCalledWith(undefined);
  });

  test('should call `onCancel` and `onChangeText` with undefined', () => {
    render(
      <SearchBar
        placeholder={placeholder}
        onChangeText={onChangeText}
        onCancel={onCancel}
      />,
    );

    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__SearchBar__container-view'),
        'layout',
        {
          nativeEvent: { layout: { width: 450, height: 100 } },
        },
      );
    });

    fireEvent(screen.getByTestId('azzapp__SearchBar__cancel-button'), 'press');
    expect(onCancel).toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
    expect(onChangeText).toHaveBeenCalledWith(undefined);
  });

  test('should show the correct `placeholder` text', () => {
    render(<SearchBar placeholder={placeholder} onChangeText={onChangeText} />);
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__SearchBar__container-view'),
        'layout',
        {
          nativeEvent: { layout: { width: 450, height: 100 } },
        },
      );
    });

    const wrapper = screen.queryByPlaceholderText(placeholder);
    expect(wrapper).not.toBeNull();
  });
});
