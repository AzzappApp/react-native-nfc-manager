import { useState } from 'react';

export function useHover() {
  const [value, setValue] = useState<boolean>(false);

  const onMouseEnter = () => {
    setValue(true);
  };

  const onMouseLeave = () => {
    setValue(false);
  };

  const element = {
    onMouseEnter,
    onMouseLeave,
  };

  return [element, value] as const;
}
