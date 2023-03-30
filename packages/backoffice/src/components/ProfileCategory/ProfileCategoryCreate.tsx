import * as React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  ImageInput,
  BooleanInput,
  SaveButton,
  Toolbar,
  SelectInput,
  ImageField,
  NumberInput,
  ArrayInput,
  SimpleFormIterator,
} from 'react-admin';
import { uploadMedia, uploadSign } from '@azzapp/shared/WebAPI';
import { injectToken } from '#App';
import { getTokens } from '#helpers/tokenStore';

export const validateForm = (
  values: Record<string, any>,
): Record<string, any> => {
  const errors = {} as any;
  if (!values.label) {
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

const ProfileCategoryCreate = () => {
  const transform = async (dataForm: Record<string, any>) => {
    const {
      available,
      label,
      profileKind,
      medias: formMedias,
      order,
      activities,
    } = dataForm;
    try {
      const mediasUploads = await Promise.all(
        (formMedias as any[]).map(async (media: any) => ({
          file: media.rawFile as File,
          uploadInfos: await uploadSign(
            {
              kind: 'image',
              target: 'cover', //TODO maybe create a target profileCategory
            },
            injectToken(getTokens()?.token ?? undefined),
          ),
        })),
      );
      const medias = await Promise.all(
        mediasUploads.map(({ file, uploadInfos }) => {
          const { uploadURL, uploadParameters } = uploadInfos;
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
        available,
        labels: { en: label },
        profileKind,
        medias,
        order: parseInt(order, 10),
        activities,
      };
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Create transform={transform}>
      <SimpleForm
        defaultValues={{
          available: true,
        }}
        validate={validateForm}
        toolbar={
          <Toolbar>
            <SaveButton label="Save" />
          </Toolbar>
        }
      >
        <div style={{ display: 'list-item', flexDirection: 'row' }}>
          <SectionTitle label="Profile Category available to user" />
          <BooleanInput source="available" />
          <SectionTitle label="Label (en-US) version" />
          <TextInput source="label" label="Label" fullWidth />
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
          <div style={{ display: 'inline' }}>
            <ImageInput
              source="medias"
              label=""
              accept="image/png"
              helperText="No control is done on the width, height, ratio and format of the
          image. Please test the image before uploading it."
              multiple
            >
              <ImageField source="src" title="" />
            </ImageInput>
          </div>
          <NumberInput source="order" label="Order" />
          <ArrayInput source="activities">
            <SimpleFormIterator inline>
              <TextInput source="labels.en" label="Label" />
            </SimpleFormIterator>
          </ArrayInput>
        </div>
      </SimpleForm>
    </Create>
  );
};

export default ProfileCategoryCreate;

const SectionTitle = ({ label }: { label: string }) => {
  return <span style={{ fontWeight: 'bold', fontSize: 20 }}>{label}</span>;
};
