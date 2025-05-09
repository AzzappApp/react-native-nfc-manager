import * as Sentry from '@sentry/react-native';
import { createContext, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';

type IsWhatsAppSupportedContextProps = boolean;

export const isWhatsAppSupportedContext =
  createContext<IsWhatsAppSupportedContextProps>(false);

/*
 * simplify access to whatsapp available information
 */
export const useIsWhatsAppSupportedContext = (): boolean => {
  return useContext(isWhatsAppSupportedContext);
};

/*
 * build a deeplink to whatsapp from a phone number
 */
export const getWhatsAppUrl = (number: string) => {
  return `whatsapp://send?phone=${number}`;
};

/**
 * This context is use the query is whatsapp is supported on the device
 * The goal of this context is to ensure not all whatsapp links check if the app is install before being displayed
 */
export const IsWhatsappSupportedProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const [isWhatsappSupported, setIsWhatsappSupported] =
    useState<boolean>(false);

  useEffect(() => {
    const testWhatsApp = async () => {
      // put a random number to check whatsapp phone deeplink works
      const url = getWhatsAppUrl('0');
      try {
        const isSupported = await Linking.canOpenURL(url);
        if (!isSupported) {
          console.warn(`${url} is not supported`);
        }
        setIsWhatsappSupported(isSupported);
      } catch (e) {
        Sentry.captureException(e);
      }
    };
    testWhatsApp();
  }, []);

  return (
    <isWhatsAppSupportedContext.Provider value={isWhatsappSupported}>
      {children}
    </isWhatsAppSupportedContext.Provider>
  );
};
