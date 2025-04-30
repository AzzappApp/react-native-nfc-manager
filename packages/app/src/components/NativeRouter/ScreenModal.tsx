import { useEffect, useMemo, useRef } from 'react';
import { createId } from '#helpers/idHelpers';
import useLatestCallback from '#hooks/useLatestCallback';
import { useRouter } from './routerHooks';
import type { ReactNode } from 'react';

export type ModalDismissRequestEvent = { preventModalDismiss(): void };

export type ScreenModalProps = {
  /**
   * If true, display the modal. Defaults to false.
   */
  visible?: boolean;
  /**
   * The type of animation to use when the modal is shown.
   */
  animationType?: 'fade' | 'none' | 'slide';
  /**
   * The content of the modal.
   */
  children?: ReactNode | null;
  /**
   * Called when the modal is requested to be closed by the user.
   * The modal will not actually be closed if preventModalDismiss is called.
   * This function is mandatory for Android back button handling and IOS swipe down gesture.
   */
  onRequestDismiss(event: ModalDismissRequestEvent): void;
  /**
   * If true, the modal can be dismissed by swiping down. Defaults to true.
   * This prop is only available on iOS,
   * but mandatory if you want to prevent the modal from being dismissed.
   */
  gestureEnabled?: boolean;
};

const ScreenModal = ({
  visible = false,
  animationType = 'slide',
  children,
  gestureEnabled = true,
  onRequestDismiss,
}: ScreenModalProps) => {
  const id = useMemo(() => createId(), []);

  const descriptor = useMemo(
    () => ({
      id,
      animationType,
      gestureEnabled,
    }),
    [id, animationType, gestureEnabled],
  );

  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const onRequestCloseLatest = useLatestCallback(onRequestDismiss);
  useEffect(() => {
    const subscription = router.addModalCloseRequestListener(modalId => {
      if (modalId !== id) {
        return false;
      }
      let preventBackButtonDismiss = false;
      onRequestCloseLatest({
        preventModalDismiss() {
          preventBackButtonDismiss = true;
        },
      });
      return preventBackButtonDismiss;
    });
    return () => {
      subscription.dispose();
    };
  }, [router, id, onRequestCloseLatest]);

  const shown = useRef(false);
  useEffect(() => {
    if (shown.current === visible) {
      return;
    }
    if (visible) {
      routerRef.current.showModal(descriptor, children);
      shown.current = true;
    } else {
      routerRef.current.hideModal(id);
      shown.current = false;
    }
  }, [children, descriptor, id, visible]);

  useEffect(() => {
    routerRef.current.updateModal(id, {
      content: children,
      gestureEnabled,
      animationType,
    });
  }, [id, children, gestureEnabled, animationType]);

  useEffect(
    () => () => {
      routerRef.current.hideModal(id);
    },
    [id],
  );

  return null;
};

export default ScreenModal;

export const preventModalDismiss = (event: ModalDismissRequestEvent) => {
  event.preventModalDismiss();
};
