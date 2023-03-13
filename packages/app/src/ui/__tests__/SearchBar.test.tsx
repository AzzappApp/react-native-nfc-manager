import '@testing-library/jest-native/extend-expect';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import SearchBar from '../SearchBar';

const placeholder = 'placeholder';
const onChangeText = jest.fn();
const onBlur = jest.fn();
const onCancel = jest.fn();
const onClear = jest.fn();
const onFocus = jest.fn();
const searchText = 'some text';

jest.mock('#ui/ViewTransition', () => 'ViewTransition');

describe('SearchBar component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    onChangeText.mockReset();
    onBlur.mockReset();
    onCancel.mockReset();
    onFocus.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('TextInput should be null is `onLayout` is not call', () => {
    render(<SearchBar placeholder={placeholder} onChangeText={onChangeText} />);
    expect(screen.queryByTestId('azzapp__searchbar__textInput')).toBeNull();
  });

  test('should render correctly when `onLayout` is call', () => {
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
    expect(screen.queryByTestId('azzapp__searchbar__textInput')).not.toBeNull();
    expect(
      screen.queryByTestId('azzapp__SearchBar__view-inputcontainer'),
    ).toHaveStyle({ width: 450 });
  });

  test('should call the `onChangeText` callback when writting text', () => {
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
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__searchbar__textInput'),
        'onChangeText',
        searchText,
      );
    });
    expect(screen.queryByTestId('azzapp__searchbar__textInput')).toHaveProp(
      'value',
      searchText,
    );

    expect(onChangeText).toHaveBeenCalledWith(searchText);
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

  test('should call `onCancel` and not `onChangeText` when touching the cancel button', () => {
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
    expect(onChangeText).not.toHaveBeenCalled();
  });

  test('should resize and show cancel button when touching the input', () => {
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

    expect(
      screen.getByTestId('azzapp__SearchBar__view-inputcontainer'),
    ).toHaveStyle({ width: 450 });

    fireEvent(screen.getByTestId('azzapp__searchbar__textInput'), 'focus');
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(
      screen.getByTestId('azzapp__SearchBar__view-inputcontainer'),
    ).toHaveStyle({ width: 440 });
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
