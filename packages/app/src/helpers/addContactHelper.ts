import EventEmitter from 'events';
import { useEffect } from 'react';

const addContactEventHandler = new EventEmitter();
const contactAddedEvent = 'onContactAdded';

export const emitContactAdded = () => {
  addContactEventHandler.emit(contactAddedEvent);
};

export const useOnContactAdded = (callback: () => void) => {
  useEffect(() => {
    addContactEventHandler.on(contactAddedEvent, callback);
    return () => {
      addContactEventHandler.off(contactAddedEvent, callback);
    };
  }, [callback]);
};
