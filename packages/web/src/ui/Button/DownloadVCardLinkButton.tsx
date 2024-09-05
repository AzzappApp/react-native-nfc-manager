'use client';

import { saveAs } from 'file-saver';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import LinkButton from './LinkButton';

type ButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  type?: 'primary' | 'secondary';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
  userName: string;
};

const DownloadVCardLinkButton = (props: ButtonProps) => {
  const { download, href, userName, ...others } = props;

  const [isDownloadSupported, setIsDownloadSupported] = useState(false);
  const [compressedContactCard, setCompressedContactCard] = useState<
    string | null
  >(null);
  const searchParams = useSearchParams();

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

    const compressedContactCardInUrl = searchParams.get('c');
    if (!compressedContactCardInUrl) {
      return;
    }
    setCompressedContactCard(compressedContactCardInUrl);
  }, [searchParams]);

  const handleDownload = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      if (isDownloadSupported) {
        const tempLink = document.createElement('a');
        tempLink.href = href ?? '';
        tempLink.download = download ?? '';
        tempLink.click();
        return;
      }

      if (!compressedContactCard) {
        return;
      }

      saveAs(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/downloadVCard?c=${compressedContactCard}.vcf&u=${userName}`,
        download ?? 'azzapp-contact.vcf',
      );
    },
    [compressedContactCard, download, href, isDownloadSupported, userName],
  );

  return <LinkButton {...others} onClick={handleDownload} />;
};

export default DownloadVCardLinkButton;

const supportedBrowserUserAgents = ['safari', 'chrome'];
// Exclude Firefox and Opera
const unsupportedBrowserUserAgents = ['fxios/', 'opt/'];
