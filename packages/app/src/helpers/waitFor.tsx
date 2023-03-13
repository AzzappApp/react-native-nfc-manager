import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

/**
 * An HOC to wait for a promise to resolve before rendering a component.
 * @param Component The component to render.
 * @param promise The promise to wait for.
 * @param Fallback The fallback component to render while waiting.
 */
function waitFor(
  Component: ComponentType,
  promise: Promise<any>,
  Fallback?: ComponentType<any>,
) {
  const WrapperComponent = (props: any) => {
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
