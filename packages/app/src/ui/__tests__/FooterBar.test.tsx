import { fireEvent, render, screen } from '@testing-library/react-native';
import FooterBar from '../FooterBar';

describe('FooterBar', () => {
  const onTabPressMock = jest.fn();
  beforeEach(() => {
    onTabPressMock.mockReset();
    render(
      <FooterBar
        currentTab="azzapp"
        onItemPress={onTabPressMock}
        tabs={[
          { key: 'account', icon: 'home', label: 'account' },
          {
            key: 'add-something',
            icon: 'search',
            label: 'add something',
          },
          {
            key: 'azzapp',
            icon: 'albums',
            label: 'Azzapp',
          },
        ]}
      />,
    );
  });

  test('should display a list of tabs', async () => {
    expect(screen.queryByRole('tablist')).not.toBe(null);
    const tabs = screen.queryAllByRole('tab');
    expect(tabs.length).toBe(3);
    expect(tabs.map(tab => tab.props.accessibilityLabel)).toEqual([
      'account',
      'add something',
      'Azzapp',
    ]);
    expect(tabs.map(tab => tab.props.accessibilityState)).toEqual([
      { selected: false },
      { selected: false },
      { selected: true },
    ]);
  });

  test('should dispatch onTabPressed event when a tab is pressed', async () => {
    const tabs = screen.queryAllByRole('tab');

    expect(onTabPressMock).not.toHaveBeenCalled();
    fireEvent.press(tabs[1]);
    expect(onTabPressMock).toHaveBeenCalledWith('add-something');
    fireEvent.press(tabs[2]);
    expect(onTabPressMock).toHaveBeenCalledWith('azzapp');
  });
});
