import Image from 'next/image';
import { useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import Avatar from '#ui/Avatar/Avatar';
import Modal from '#ui/Modal';
import styles from './WhatsappButton.css';
import type { ModalActions } from '#ui/Modal';

type Props = {
  contactInitials: string;
  phoneNumbers: Array<{
    label: string;
    number: string;
  }>;
  avatarUrl?: string;
};

const WhatsappButton = ({
  contactInitials,
  phoneNumbers,
  avatarUrl,
}: Props) => {
  const intl = useIntl();
  const phoneNumbersModal = useRef<ModalActions>(null);

  const openPhoneNumber = (phoneNumber: string) => {
    window.open(
      `https://wa.me/${phoneNumber}?text=${intl.formatMessage({
        defaultMessage: 'Hello',
        id: 'xuXlIz',
        description: 'Hello message for whatsapp contact discussion button',
      })}`,
      '_blank',
    );
  };

  const onClick = () => {
    if (phoneNumbers.length === 1) {
      openPhoneNumber(phoneNumbers[0].number);
    } else {
      phoneNumbersModal.current?.open();
    }
  };

  const onCloseModal = () => {
    phoneNumbersModal.current?.close();
  };

  return (
    <>
      <div role="button" className={styles.whatsappContainer} onClick={onClick}>
        {avatarUrl ? (
          <Avatar
            className={styles.whatsappAvatar}
            variant="image"
            url={avatarUrl}
            alt="avatar"
          />
        ) : (
          <Avatar
            className={styles.whatsappAvatar}
            variant="initials"
            initials={contactInitials}
          />
        )}
        <Image
          className={styles.whatsappIcon}
          alt="whatsapp"
          src="/whatsapp.svg"
          width={19}
          height={19}
        />
      </div>
      <Modal
        ref={phoneNumbersModal}
        className={styles.modal}
        onClose={onCloseModal}
        hideCloseButton
      >
        <div className={styles.modalTitle}>
          <FormattedMessage
            defaultMessage="Select a number to contact on WhatsApp"
            id="gCCa+y"
            description="title in whatsapp phone numbers select modal"
          />
        </div>
        {phoneNumbers.map(({ label, number }) => (
          <div
            role="button"
            className={styles.modalRow}
            key={`${label}${number}`}
            onClick={() => {
              openPhoneNumber(number);
            }}
          >
            <div>{label}</div>
            <div className={styles.numberCell}>
              <span>{number}</span>
              <Image
                alt="whatsapp"
                src="/whatsapp.svg"
                width={31}
                height={31}
              />
            </div>
          </div>
        ))}
      </Modal>
    </>
  );
};

export default WhatsappButton;
