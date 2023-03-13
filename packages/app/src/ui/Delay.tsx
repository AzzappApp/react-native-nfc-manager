import { useEffect, useState } from 'react';

type DelayProps = {
  /**
   * The amount of time to delay the rendering of the children.
   */
  delay: number;
  /**
   * The children to render.
   */
  children: React.ReactNode;
};

/**
 * A component that delays the rendering of its children by a given amount of time.
 */
const Delay = (props: DelayProps): any => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, props.delay);
    return () => clearTimeout(timeout);
  }, [props.delay]);
  return show ? props.children : null;
};

export default Delay;
