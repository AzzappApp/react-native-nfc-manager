import { FileSystemUploadType, UploadTask } from 'expo-file-system';
import React, { createContext, useState, useContext, useMemo } from 'react';
import * as mime from 'react-native-mime-types';
import { getFileName } from '#helpers/fileHelpers';
import type { ReactNode } from 'react';

// Define the context value type
type CoverUploadContextType = {
  progress: number;
  coverwebCardIdUploading: string | null;
  startUpload: (
    path: string,
    uploadURL: string,
    uploadParameters: Record<string, any>,
    kind: 'image' | 'video',
    webCardId: string,
    onComplete: () => Promise<void>,
  ) => Promise<void>;
};

// Create the context with a default value of `undefined`
const CoverUploadContext = createContext<CoverUploadContextType | undefined>(
  undefined,
);

// Define the props for the provider
type CoverUploadProviderProps = {
  children: ReactNode;
};

// Define the UploadProvider component
export const ContextUploadProvider = ({
  children,
}: CoverUploadProviderProps) => {
  // Define the state for the progress and isUploading, only handling one cover at a time,
  // if parallel cover upload is required, refactor with object of progress by id
  const [progress, setProgress] = useState<number>(0);
  //if not null, that means a cover is being uploaded
  const [coverwebCardIdUploading, setCoverwebCardIdUploading] = useState<
    string | null
  >(null);

  const startUpload = async (
    path: string,
    uploadURL: string,
    uploadParameters: Record<string, any>,
    kind: 'image' | 'video',
    coverId: string,
    onComplete: () => Promise<void>,
  ): Promise<void> => {
    setCoverwebCardIdUploading(coverId);
    try {
      const uploadTask = new UploadTask(
        uploadURL,
        path,
        {
          uploadType: FileSystemUploadType.MULTIPART,
          httpMethod: 'POST',
          fieldName: 'file',
          mimeType:
            mime.lookup(getFileName(path)) ||
            (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
          parameters: Object.fromEntries(
            Object.entries(uploadParameters).map(([key, value]) => [
              key,
              value.toString(),
            ]),
          ),
        },
        ({ totalBytesSent, totalBytesExpectedToSend }) => {
          setProgress((totalBytesSent / totalBytesExpectedToSend) * 100);
        },
      );
      const result = await uploadTask.uploadAsync();
      if (!result) {
        throw new Error('Error uploading media');
      }

      onComplete();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setCoverwebCardIdUploading(null);
      setProgress(0);
    }
  };

  const routerInfiniteRenderHack = useMemo(
    () => ({ progress, coverwebCardIdUploading, startUpload }),
    [coverwebCardIdUploading, progress],
  );

  return (
    <CoverUploadContext.Provider value={routerInfiniteRenderHack}>
      {children}
    </CoverUploadContext.Provider>
  );
};

export const useCoverUpload = () => {
  const context = useContext(CoverUploadContext);
  if (context === null) {
    throw new Error('Using CoverUploadContext without provider');
  }

  return context!;
};
