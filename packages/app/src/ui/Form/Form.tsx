import React, { useRef, useMemo, useContext, cloneElement } from 'react';
import { View } from 'react-native';

import FormContext from './FormContext';
import type { ReactElement } from 'react';
import type { ViewProps } from 'react-native';

const Form = ({ onSubmit, ...props }: ViewProps & { onSubmit(): void }) => {
  const refSubmit = useRef(onSubmit);

  refSubmit.current = onSubmit;

  const contextValue = useMemo(
    () => ({
      onSubmit() {
        refSubmit.current?.();
      },
    }),
    [],
  );

  return (
    <FormContext.Provider value={contextValue}>
      <View {...props} />
    </FormContext.Provider>
  );
};

export default Form;

export const Submit = ({ children }: { children: ReactElement }) => {
  const { onSubmit } = useContext(FormContext);

  return cloneElement(React.Children.only(children), { onPress: onSubmit });
};
