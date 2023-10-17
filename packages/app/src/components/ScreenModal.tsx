import { useContext, useEffect, useMemo, useRef } from 'react';
import { ReactRelayContext, RelayEnvironmentProvider } from 'react-relay';
import { createId } from '#helpers/idHelpers';
import { useRouter } from './NativeRouter';
import type { ReactNode } from 'react';

export type ScreenModalProps = {
  visible?: boolean;
  animationType?: 'fade' | 'none' | 'slide';
  onWillAppear?: () => void;
  onDisappear?: () => void;
  children?: ReactNode | null;
};

const ScreenModal = ({
  visible = false,
  animationType = 'slide',
  onWillAppear,
  onDisappear,
  children,
}: ScreenModalProps) => {
  const id = useMemo(() => createId(), []);
  const relayContext = useContext(ReactRelayContext);

  const descriptor = useMemo(
    () => ({
      id,
      animationType,
      onWillAppear,
      onDisappear,
      children: children ? (
        relayContext ? (
          <RelayEnvironmentProvider {...relayContext}>
            {children}
          </RelayEnvironmentProvider>
        ) : (
          children
        )
      ) : null,
    }),
    [id, animationType, onWillAppear, onDisappear, children, relayContext],
  );

  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (visible) {
      routerRef.current.showModal(descriptor);
    } else {
      routerRef.current.hideModal(id);
    }
  }, [id, descriptor, visible]);

  useEffect(
    () => () => {
      routerRef.current.hideModal(id);
    },
    [id],
  );

  return null;
};

export default ScreenModal;
