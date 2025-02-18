import cx from 'classnames';
import { textButton } from '#app/[userName]/theme.css';
import styles from './TabBar.css';

type TabBarProps = {
  tabs: Array<{
    id: string;
    title: string;
    icon: React.ReactNode;
  }>;
  activeTab: string;
  className?: string;
  onTabChange: (tab: string) => void;
};

const TabBar = ({ tabs, activeTab, className, onTabChange }: TabBarProps) => (
  <div className={cx(className, styles.tabBar)} role="tablist">
    {tabs.map(({ id, title, icon }) => (
      <button
        key={id}
        className={styles.tab}
        onClick={() => onTabChange(id)}
        id={`${id}-tab`}
        role="tab"
        aria-selected={id === activeTab}
        aria-controls={`${id}-panel`}
      >
        {icon}
        <div className={textButton}>{title}</div>
      </button>
    ))}
  </div>
);

export default TabBar;
