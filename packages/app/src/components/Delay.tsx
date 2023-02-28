import { useEffect, useState } from 'react';

type DelayProps = {
  delay: number;
  children: React.ReactNode;
};

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
