import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

function waitFor<U>(
  Component: ComponentType<U>,
  promise: Promise<any>,
  Fallback?: ComponentType<any>,
) {
  const WrapperComponent = (props: U) => {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      promise.finally(() => setReady(true));
    }, []);

    if (ready) {
      return <Component {...props} />;
    }
    return Fallback ? <Fallback /> : null;
  };

  WrapperComponent.displayName = `WaitFor(${
    Component.displayName ?? Component.name
  })`;

  return WrapperComponent;
}

export default waitFor;
