'use client';
import cn from 'classnames';
import {
  forwardRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  type HTMLAttributes,
  type ReactNode,
  type ForwardedRef,
} from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '#assets';
import { ButtonIcon } from '#ui';
import useOnClickOutside from '#hooks/useOnClickOutside';
import styles from './Modal.css';

export type ModalProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hideCloseButton?: boolean;
  onClose?: () => void;
};

export type ModalActions = {
  open: () => void;
  close: () => void;
};

// eslint-disable-next-line react/display-name
const Modal = forwardRef(
  (props: ModalProps, ref: ForwardedRef<ModalActions>) => {
    const { className, hideCloseButton, children, onClose, ...others } = props;
    const classnames = cn(className, styles.modal);

    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);

    const handleClose = useCallback(() => {
      if (open) {
        setClosing(true);
        setOpen(false);
        onClose?.();
      }
    }, [onClose, open]);

    const window = useOnClickOutside<HTMLDivElement>(handleClose);

    useImperativeHandle(
      ref,
      () => ({
        open: () => setOpen(true),
        close: handleClose,
      }),
      [handleClose],
    );

    useEffect(() => {
      if (open) document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'initial';
      };
    }, [open]);

    const handleAnimationEnd = useCallback(() => {
      if (!open) {
        setClosing(false);
      }
    }, [open]);

    if (!open && !closing) return null;

    return createPortal(
      <div
        className={cn(styles.wrapper, { [styles.wrapperClosing]: closing })}
        onAnimationEnd={handleAnimationEnd}
      >
        <div
          {...others}
          className={cn(classnames, { [styles.modalClosing]: closing })}
          ref={window}
        >
          <div className={styles.modalContent}>
            {!hideCloseButton && (
              <ButtonIcon
                onClick={handleClose}
                size={30}
                Icon={CloseIcon}
                className={styles.close}
              />
            )}
            {children}
          </div>
        </div>
      </div>,
      document.body,
    );
  },
);

export default Modal;
