import cx from 'classnames';
import { textButton } from '#app/[userName]/theme.css';
import stylesVariants from './TabBar.css';

type TabBarProps = {
  tabs: Array<{
    id: string;
    title: string;
    icon: React.ReactNode;
    disabled?: boolean;
  }>;
  variant?: 'default' | 'toggle';
  activeTab: string;
  className?: string;
  onTabChange: (tab: string) => void;
};

const TabBar = ({
  tabs,
  activeTab,
  variant = 'default',
  className,
  onTabChange,
}: TabBarProps) => {
  const styles = stylesVariants[variant];
  return (
    <div className={cx(className, styles.tabBar)} role="tablist">
      {tabs.map(({ id, title, icon, disabled = false }) => (
        <button
          key={id}
          className={styles.tab}
          onClick={() => onTabChange(id)}
          id={`${id}-tab`}
          role="tab"
          aria-selected={id === activeTab}
          aria-controls={`${id}-panel`}
          {...(disabled && {
            disabled: true,
            'aria-disabled': true,
          })}
        >
          {icon}
          <div className={textButton}>{title}</div>
        </button>
      ))}
    </div>
  );
};

export default TabBar;
