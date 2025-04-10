import EventEmitter from 'events';
import { useEffect } from 'react';

// Signal a new contact has been added to device contacts
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
