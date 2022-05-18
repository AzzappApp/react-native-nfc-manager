import { createContext } from 'react';
import type { Disposable } from 'react-relay';

export type ModuleEditor = {
  setCanSave(hasUnsavedChange: boolean): void;
  onSaved(): void;
  onSaveError(error: Error): void;
  setSaveListener(save: () => void): { dispose(): void };
  setCancelListener(
    cancel: (() => Promise<boolean>) | (() => void),
  ): Disposable;
};

const ModuleEditorContext = createContext<ModuleEditor | null>(null);

export default ModuleEditorContext;
