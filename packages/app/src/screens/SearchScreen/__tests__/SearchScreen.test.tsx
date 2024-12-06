import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import { SearchScreen } from '../SearchScreen';

jest.mock('../SearchTabContainer', () => {
  const { createElement } = require('react');
  function SearchTabContainer({
    searchValue,
  }: {
    searchValue: string | undefined;
  }) {
    return createElement('SearchTabContainer', {
      searchValue,
      testID: 'SearchTabContainer',
    });
  }

  return SearchTabContainer;
});

jest.mock('../RecentSearch', () => 'RecentSearch');

const renderScreen = () => {
  const environment = createMockEnvironment();

  environment.mock.queueOperationResolver(operation => {
    return MockPayloadGenerator.generate(operation, {
      PageInfo() {
        return {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
          endCursor: 'YXJyYXljb25uZWN0aW9uOjE=',
        };
      },

      Viewer(_, generateId) {
        return {
          trendingProfilesList: {
            edges: [
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: String(generateId()),
                  userName: 'username1',
                },
              },
            ],
          },
          recommendedProfilesList_profile: {
            edges: [
              {
                node: {
                  id: String(generateId()),
                },
              },
            ],
          },
          trendingPostsList_profile: {
            edges: [
              {
                node: {
                  id: String(generateId()),
                },
              },
            ],
          },
        };
      },
    });
  });

  const TestRenderer = () => {
    return <SearchScreen hasFocus />;
  };

  const component = render(
    <RelayEnvironmentProvider environment={environment}>
      <TestRenderer />
    </RelayEnvironmentProvider>,
  );

  return {
    rerender() {
      component.rerender(
        <RelayEnvironmentProvider environment={environment}>
          <TestRenderer />
        </RelayEnvironmentProvider>,
      );
    },
  };
};
// TODO this test is invalid the mocked data are not valid
xdescribe('SearchScreen component', () => {
  jest.useFakeTimers();

  test('RecentSearch should be displayed on focus SearchBar (having opacity = 1)', () => {
    renderScreen();

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
      fireEvent(screen.getByTestId('azzapp__searchbar__textInput'), 'onFocus');
    });
    expect(screen.queryByTestId('WallRecommendation')).not.toBeNull();
    expect(
      screen.queryByTestId('azzaap_searchScreeb-RecentSearch_viewTransition'),
    ).toHaveStyle({ opacity: 1 });
    expect(screen.queryByTestId('SearchTabContainer')).toBeNull();
  });

  test('`onSubmittedSearch`should mount the SearchTab Container', () => {
    renderScreen();
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
      fireEvent(screen.getByTestId('azzapp__searchbar__textInput'), 'onFocus');
    });
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__searchbar__textInput'),
        'onChangeText',
        'search',
      );
    });
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__searchbar__textInput'),
        'onSubmitEditing',
      );
    });
    expect(screen.queryByTestId('SearchTabContainer')).not.toBeNull();
  });

  test('should display recent search when removing the search text after SearchTabContainer was mount', () => {
    renderScreen();
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
      fireEvent(screen.getByTestId('azzapp__searchbar__textInput'), 'onFocus');
    });
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__searchbar__textInput'),
        'onChangeText',
        'search',
      );
    });
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__searchbar__textInput'),
        'onSubmitEditing',
      );
    });
    expect(screen.queryByTestId('SearchTabContainer')).not.toBeNull();
    expect(
      screen.queryByTestId('azzaap_searchScreeb-RecentSearch_viewTransition'),
    ).toHaveStyle({ opacity: 1 });
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp__searchbar__textInput'),
        'onChangeText',
        null,
      );
    });
    expect(screen.queryByTestId('SearchTabContainer')).toBeNull();
  });
});
