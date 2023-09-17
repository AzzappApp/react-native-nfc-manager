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
};

export type ModalActions = {
  open: () => void;
  close: () => void;
};

// eslint-disable-next-line react/display-name
const Modal = forwardRef(
  (props: ModalProps, ref: ForwardedRef<ModalActions>) => {
    const { className, children, ...others } = props;
    const classnames = cn(className, styles.modal);

    const [open, setOpen] = useState(false);
    const onClickOutside = useCallback(() => {
      if (open) setOpen(false);
    }, [open]);

    const window = useOnClickOutside<HTMLDivElement>(onClickOutside);

    useImperativeHandle(
      ref,
      () => ({
        open: () => setOpen(true),
        close: () => setOpen(false),
      }),
      [],
    );

    useEffect(() => {
      if (open) document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'initial';
      };
    }, [open]);

    if (!open) return null;

    return createPortal(
      <div className={styles.wrapper}>
        <div {...others} className={classnames} ref={window}>
          <ButtonIcon
            onClick={() => setOpen(false)}
            size={30}
            Icon={CloseIcon}
            className={styles.close}
          />
          {children}
        </div>
      </div>,
      document.body,
    );
  },
);

export default Modal;
