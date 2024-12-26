import { createContext, useContext } from 'react';

const CardModuleEditionContext = createContext<boolean>(false);

export const useIsCardModuleEdition = () => {
  return useContext(CardModuleEditionContext);
};

export const CardModuleEditionProvider = CardModuleEditionContext.Provider;
