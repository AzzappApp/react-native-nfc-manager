import { useContext, useEffect, useMemo, useRef } from 'react';
import { ReactRelayContext, RelayEnvironmentProvider } from 'react-relay';
import { createId } from '#helpers/idHelpers';
import useLatestCallback from '#hooks/useLatestCallback';
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

  const content = useMemo(
    () =>
      children ? (
        relayContext ? (
          <RelayEnvironmentProvider {...relayContext}>
            {children}
          </RelayEnvironmentProvider>
        ) : (
          children
        )
      ) : null,
    [children, relayContext],
  );

  const onWillAppearRef = useLatestCallback(onWillAppear);
  const onDisappearRef = useLatestCallback(onDisappear);

  const descriptor = useMemo(
    () => ({
      id,
      animationType,
      onWillAppearRef,
      onDisappearRef,
    }),
    [id, animationType, onWillAppearRef, onDisappearRef],
  );

  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    routerRef.current.setModalContent(id, content);
  }, [id, content]);

  useEffect(() => {
    if (visible) {
      routerRef.current.showModal(descriptor, content);
    } else {
      routerRef.current.hideModal(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
