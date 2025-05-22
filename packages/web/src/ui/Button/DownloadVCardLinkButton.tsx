'use client';

import { saveAs } from 'file-saver';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import env from '#env';
import IosAddContactInfoModal from '#components/IosAddContactInfoModal';
import LinkButton from './LinkButton';
import type { ModalActions } from '#ui/Modal';

type ButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  type?: 'primary' | 'secondary';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
  userName: string;
};

const DownloadVCardLinkButton = (props: ButtonProps) => {
  const { download, href, userName, onClick, ...others } = props;

  const [isDownloadSupported, setIsDownloadSupported] = useState(false);

  const searchParams = useSearchParams();

  const iosInformationModal = useRef<ModalActions>(null);

  useEffect(() => {
    if (
      supportedBrowserUserAgents.some(userAgent =>
        navigator.userAgent.toLowerCase().includes(userAgent),
      ) &&
      !unsupportedBrowserUserAgents.some(userAgent =>
        navigator.userAgent.toLowerCase().includes(userAgent),
      )
    ) {
      setIsDownloadSupported(true);
    }
  }, [searchParams]);

  const handleDownload = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      iosInformationModal.current?.close();

      if (isDownloadSupported) {
        const tempLink = document.createElement('a');
        tempLink.href = href ?? '';
        tempLink.download = download ?? '';
        tempLink.click();
        onClick?.(e);
        return;
      }

      const dataWithKey = searchParams.get('k');
      if (!dataWithKey) {
        onClick?.(e);
        return;
      }

      const blob = new Blob(
        [
          btoa(
            `${env.NEXT_PUBLIC_API_ENDPOINT}/downloadVCard?k=${dataWithKey}.vcf&u=${userName}`,
          ),
        ],
        {
          type: 'text/plain;charset=utf-8',
        },
      );

      saveAs(blob, download ?? 'azzapp-contact.vcf');
      onClick?.(e);
    },
    [searchParams, download, href, isDownloadSupported, onClick, userName],
  );

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad/.test(userAgent);

    if (isIOS) {
      iosInformationModal.current?.open();
    } else {
      handleDownload(e);
    }
  };

  return (
    <>
      <LinkButton {...others} onClick={handleClick} />
      <IosAddContactInfoModal
        ref={iosInformationModal}
        onConfirm={handleDownload}
      />
    </>
  );
};

export default DownloadVCardLinkButton;

const supportedBrowserUserAgents = ['safari', 'chrome', 'mozilla'];
// Exclude Firefox and Opera
const unsupportedBrowserUserAgents = ['fxios/', 'opt/'];
