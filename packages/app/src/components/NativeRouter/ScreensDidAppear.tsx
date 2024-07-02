import { useContext, useEffect, useMemo } from 'react';
import { createDeferred } from '@azzapp/shared/asyncHelpers';
import { ScreenRendererContext } from './routerContexts';
import type { ReactNode } from 'react';

export const ScreenDidAppear = ({ children }: { children: ReactNode }) => {
  const deferred = useMemo(() => createDeferred<boolean>(), []);
  const { didAppear } = useContext(ScreenRendererContext);

  useEffect(() => {
    if (didAppear) {
      deferred.resolve(true);
    }
  }, [didAppear, deferred]);

  return (
    <ScreenDidAppearInner
      screenDidAppear={didAppear}
      promise={deferred.promise}
    >
      {children}
    </ScreenDidAppearInner>
  );
};

const ScreenDidAppearInner = ({
  screenDidAppear,
  promise,
  children,
}: {
  screenDidAppear: boolean;
  promise: Promise<boolean>;
  children: ReactNode;
}) => {
  if (!screenDidAppear) {
    throw promise;
  }
  return children;
};
