'use client';

import MainTabBar from '@azzapp/app/components/MainTabBar';
import { TAB_BAR_HEIGHT } from '@azzapp/app/ui/TabsBar';

const ScreensLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="root" style={{ paddingBottom: TAB_BAR_HEIGHT }}>
    <nav className="mainNav">
      <MainTabBar currentIndex={0} />
    </nav>
    {children}
  </div>
);

export default ScreensLayout;
