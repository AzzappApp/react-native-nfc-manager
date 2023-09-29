import { useContext } from 'react';
import { UploadModalContext } from '#components/UploadModalProvider';

export const useProgressModal = () => {
  return useContext(UploadModalContext);
};
