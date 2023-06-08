import type { Media } from '#components/ImagePicker/imagePickerTypes';

export type HorizontalPhotoEditionValue = {
  borderWidth: number;
  borderRadius: number;
  borderColor: string;
  marginHorizontal: number;
  marginVertical: number;
  height: number;
  background: Readonly<{
    id: string;
    uri: string;
  }> | null;
  backgroundStyle: Readonly<{
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  }> | null;
  color: string;
  tintColor: string;
  media: Media;
};
