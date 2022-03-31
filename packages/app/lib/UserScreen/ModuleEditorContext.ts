import { createContext } from 'react';

export type ModuleEditor = {
  setCanSave(hasUnsavedChange: boolean): void;
  onSaved(): void;
  setSaveListener(save: () => void): { dispose(): void };
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  setCancelListener(cancel: () => Promise<boolean> | void): {
    dispose(): void;
  };
};

const ModuleEditorContext = createContext<ModuleEditor | null>(null);

export default ModuleEditorContext;
