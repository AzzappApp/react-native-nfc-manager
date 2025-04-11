import EventEmitter from 'events';
import { useEffect } from 'react';

// Signal a new contact has been added to profile
const addContactToProfileEventHandler = new EventEmitter();
const ContactToProfileAddedEvent = 'onContactAddedToProfile';

export const emitContactAddedToProfile = () => {
  addContactToProfileEventHandler.emit(ContactToProfileAddedEvent);
};

export const useOnContactAddedToProfile = (callback: () => void) => {
  useEffect(() => {
    addContactToProfileEventHandler.on(ContactToProfileAddedEvent, callback);
    return () => {
      addContactToProfileEventHandler.off(ContactToProfileAddedEvent, callback);
    };
  }, [callback]);
};
