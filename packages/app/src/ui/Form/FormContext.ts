import { createContext } from 'react';

const FormContext = createContext<{ onSubmit(): void }>({
  onSubmit: () => void 0,
});

export default FormContext;
