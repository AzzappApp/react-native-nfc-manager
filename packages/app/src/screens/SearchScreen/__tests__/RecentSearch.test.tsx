import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '#helpers/testHelpers';
import RecentSearch from '../RecentSearch';
import type { CoverRendererProps } from '#components/CoverRenderer';

const removeSearch = jest.fn();
const search = jest.fn();

jest.mock('#components/CoverLink', () => {
  const { createElement } = require('react');
  function CoverLink(
    props: CoverRendererProps & {
      userId: string;
    },
  ) {
    return createElement('CoverLink', {
      userId: props.userId,
      style: props.style,
      testID: 'CoverLink',
    });
  }

  return CoverLink;
});

describe('Recent Search component', () => {
  test('should not display default message with `searchValue` undefined and empty `recentSearch`', async () => {
    render(
      <RecentSearch
        searchValue={undefined}
        recentSearch={[]}
        removeSearch={removeSearch}
        search={search}
      />,
    );

    expect(screen.queryByText('No recent search for ')).toBeNull();
  });
  test('should display a message when search value is not found in `recentSearch`', async () => {
    render(
      <RecentSearch
        searchValue="azzapp"
        recentSearch={[]}
        removeSearch={removeSearch}
        search={search}
      />,
    );

    expect(screen.getByText('No recent search for azzapp')).toBeTruthy();
  });

  test('should display full history `recentSearch` list when `searchValue is falsy', async () => {
    render(
      <RecentSearch
        searchValue={''}
        recentSearch={['azzapp', 'testing', 'android is bad']}
        removeSearch={removeSearch}
        search={search}
      />,
    );

    const list = screen.getByTestId('recent-search-list');
    expect(list).not.toBeNull();
    const items = screen.getAllByRole('link');
    expect(items.length).toBe(3);
  });

  test('should filter history `recentSearch` list based on `searchValue`', async () => {
    render(
      <RecentSearch
        searchValue="azz"
        recentSearch={['azzapp', 'testing', 'android is bad']}
        removeSearch={removeSearch}
        search={search}
      />,
    );

    const list = screen.getByTestId('recent-search-list');
    expect(list).not.toBeNull();
    const items = screen.getAllByRole('link');
    expect(items.length).toBe(1);
  });

  test('should display message when `searchValue` is not in `recentSearch`', async () => {
    render(
      <RecentSearch
        searchValue="azz2themoon"
        recentSearch={['azzapp', 'testing', 'android is bad']}
        removeSearch={removeSearch}
        search={search}
      />,
    );

    const list = screen.getByTestId('recent-search-list');
    expect(list).not.toBeNull();
    expect(
      within(screen.getByTestId('recent-search-list')).getByText(
        'No recent search for azz2themoon',
      ),
    ).toBeTruthy();
  });

  test('should dispatch onSearch event when a list item is pressed', async () => {
    render(
      <RecentSearch
        searchValue="azzapp"
        recentSearch={['azzapp', 'azzapp2', 'azzapp3']}
        removeSearch={removeSearch}
        search={search}
      />,
    );

    await waitFor(() => {
      expect(search).not.toHaveBeenCalled();
      const listItems = screen.getAllByRole('link');
      fireEvent(listItems[0], 'onPress');
      expect(search).toHaveBeenCalledWith('azzapp');
      fireEvent.press(listItems[1]);
      expect(search).toHaveBeenCalledWith('azzapp2');
    });
  });
});
