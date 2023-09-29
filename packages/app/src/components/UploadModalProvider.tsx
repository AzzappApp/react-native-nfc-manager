import { createContext, useEffect, useState } from 'react';
import { useRouter } from './NativeRouter';
import type { PropsWithChildren } from 'react';
import type { Observable } from 'relay-runtime';

export const UploadModalContext = createContext<{
  progressIndicator: Observable<number> | null;
  setProgressIndicator: (progress: Observable<number> | null) => void;
}>({
  progressIndicator: null,
  setProgressIndicator: (_progress: Observable<number> | null) => {},
});

export const UploadModalProvider = ({ children }: PropsWithChildren) => {
  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (progressIndicator) {
      if (router.getCurrentRoute()?.route !== 'PROGRESS_MODAL') {
        router.showModal({ route: 'PROGRESS_MODAL' });
      }
    }
  }, [progressIndicator, router]);

  return (
    <UploadModalContext.Provider
      value={{
        progressIndicator,
        setProgressIndicator,
      }}
    >
      {children}
    </UploadModalContext.Provider>
  );
};
