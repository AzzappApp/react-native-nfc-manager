/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from 'react';

const useSafeAreaInsets = () => {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const safeAreaInsets = require('safe-area-insets');
    const [insets, setInsets] = useState({
      top: safeAreaInsets.top,
      right: safeAreaInsets.right,
      bottom: safeAreaInsets.bottom,
      left: safeAreaInsets.top,
    });

    useEffect(() => {
      const handler = () => {
        setInsets({
          top: safeAreaInsets.top,
          right: safeAreaInsets.right,
          bottom: safeAreaInsets.bottom,
          left: safeAreaInsets.top,
        });
      };
      safeAreaInsets.onChange(handler);

      return () => {
        safeAreaInsets.offChange(handler);
      };
    });
    return insets;
  }

  return { top: 0, left: 0, right: 0, bottom: 0 };
};

export default useSafeAreaInsets;
