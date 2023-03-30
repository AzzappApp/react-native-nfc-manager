import * as React from 'react';
import {
  SimpleForm,
  TextInput,
  Edit,
  BooleanInput,
  Toolbar,
  SaveButton,
  SelectInput,
  ImageInput,
  NumberInput,
  ImageField,
  ArrayInput,
  SimpleFormIterator,
} from 'react-admin';
import {
  getImageURLForSize,
  getMediaIDFromURL,
} from '@azzapp/shared/imagesHelpers';
import { uploadMedia, uploadSign } from '@azzapp/shared/WebAPI';
import { injectToken } from '#App';
import SectionTitle from '#components/SectionTitle';
import { getTokens } from '#helpers/tokenStore';

export const validateForm = (
  values: Record<string, any>,
): Record<string, any> => {
  const errors = {} as any;
  if (!values.labels?.en) {
    errors.label = 'Label is required';
  }
  if (!values.profileKind) {
    errors.profileKind = 'Profile Kind is required';
  }
  if ((values.medias?.length ?? 0) < 3) {
    errors.medias = 'Please upload at least 3 medias';
  }
  if (isNaN(parseInt(values.order, 10))) {
    errors.order = 'Order is required';
  }
  return errors;
};

const transform = async (data: any) => {
  const {
    available,
    labels,
    profileKind,
    medias: formMedias,
    order,
    activities,
  } = data;
  const mediasUploads = await Promise.all(
    (formMedias as any[]).map(async (media: any) => {
      if (typeof media === 'string') {
        return media;
      }
      if (!media.rawFile) {
        return getMediaIDFromURL(media.src);
      }
      return {
        file: media.rawFile as File,
        uploadInfos: await uploadSign(
          {
            kind: 'image',
            target: 'cover', //TODO maybe create a target profileCategory
          },
          injectToken(getTokens()?.token ?? undefined),
        ),
      };
    }),
  );

  const medias = await Promise.all(
    mediasUploads.map(async media => {
      if (typeof media === 'string') {
        return media;
      }
      const {
        file,
        uploadInfos: { uploadURL, uploadParameters },
      } = media;
      const { promise: uploadPromise } = uploadMedia(
        file,
        uploadURL,
        uploadParameters,
      );
      return uploadPromise.then(({ public_id, width, height }) => ({
        id: public_id,
        width,
        height,
      }));
    }),
  );

  return {
    id: data.id,
    available,
    labels,
    profileKind,
    medias,
    activities,
    order: parseInt(order, 10),
  };
};

const ProfileCategoryEdit = () => {
  return (
    <Edit transform={transform}>
      <SimpleForm
        validate={validateForm}
        warnWhenUnsavedChanges
        toolbar={
          <Toolbar>
            <SaveButton label="Save" />
          </Toolbar>
        }
      >
        <SectionTitle label="Profile Category available to user" />
        <BooleanInput source="available" format={val => !!val} />
        <SectionTitle label="Label (en-US) version" />
        <TextInput source="labels.en" label="Label" fullWidth />
        <SectionTitle label="ProfileKind" />
        <SelectInput
          source="profileKind"
          choices={[
            { id: 'personal', name: 'personal' },
            { id: 'business', name: 'business' },
          ]}
          fullWidth
        />
        <SectionTitle label="Images" />
        <ImageInput
          source="medias"
          label=""
          accept="image/png"
          helperText="No control is done on the width, height, ratio and format of the
          image. Please test the image before uploading it."
          multiple
          format={formatMedias}
        >
          <ImageField source="src" title="" />
        </ImageInput>
        <NumberInput source="order" label="Order" />
        <ArrayInput source="activities">
          <SimpleFormIterator inline>
            <TextInput source="labels.en" label="Label" />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Edit>
  );
};

export default ProfileCategoryEdit;

const formatMedias = (medias: any) => {
  return medias.map((media: any) => {
    return typeof media === 'string'
      ? { src: getImageURLForSize(media, 200) }
      : media;
  });
};
