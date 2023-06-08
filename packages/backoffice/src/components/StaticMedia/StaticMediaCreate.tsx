import * as React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  ImageInput,
  ImageField,
  RadioButtonGroupInput,
  BooleanInput,
  SaveButton,
  Toolbar,
} from 'react-admin';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { uploadMedia, uploadSign } from '@azzapp/shared/WebAPI';
import { injectToken } from '#App';
import { getTokens } from '#helpers/tokenStore';

export const validateForm = (
  values: Record<string, any>,
): Record<string, any> => {
  const errors = {} as any;
  if (!values.uri) {
    errors.uri = 'Image is required';
  }
  if (!values.name) {
    errors.name = 'Name is required';
  }

  return errors;
};

const StaticMediaCreate = () => {
  const transform = async (dataForm: Record<string, any>) => {
    //doing it here becase we need to run on client side (localstorage not found on backoffice)
    const { uri, ...data } = dataForm;
    try {
      const { uploadURL, uploadParameters } = await uploadSign(
        {
          kind: 'image',
          target: 'cover', //maybe create a target static media
        },
        injectToken(getTokens()?.token ?? undefined),
      );
      const { promise: uploadPromise } = uploadMedia(
        uri.rawFile,
        uploadURL,
        uploadParameters,
      );
      const { public_id } = await uploadPromise;

      return {
        ...data,
        id: public_id,
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
          usage: 'coverForeground',
        }}
        validate={validateForm}
        toolbar={
          <Toolbar>
            <SaveButton label="Save" />
          </Toolbar>
        }
      >
        <div style={{ display: 'list-item', flexDirection: 'row' }}>
          <SectionTitle label="Cover Layer available to user" />
          <BooleanInput source="available" />
          <SectionTitle label="Image" />
          <div style={{ display: 'inline' }}>
            <ImageInput
              source="uri"
              label=""
              accept="image/*"
              helperText={`IMAGE SHOULD BE USING THE COVER RATIO ${COVER_RATIO} No control is done on t format of the
          image. Please test the image before uploading it.`}
            >
              <ImageField
                source="src"
                title=""
                sx={{ backgroundColor: 'rgba(233,233,233,0.2)' }}
              />
            </ImageInput>
          </div>
          <SectionTitle label="Name" />
          <div>
            <TextInput
              source="name"
              fullWidth
              helperText="Used for internal use only. (admin panel)"
            />
          </div>

          <SectionTitle label="Type" />
          <div style={{ marginBottom: 20 }}>
            <RadioButtonGroupInput
              source="usage"
              label=""
              choices={[
                { id: 'coverForeground', name: 'Cover Foreground' },
                { id: 'coverBackground', name: 'Cover Background' },
                { id: 'moduleBackground', name: 'Module Background' },
              ]}
            />
          </div>
          <SectionTitle label="Tags" />

          <TextInput source="tags" fullWidth />
        </div>
      </SimpleForm>
    </Create>
  );
};

export default StaticMediaCreate;

const SectionTitle = ({ label }: { label: string }) => {
  return <span style={{ fontWeight: 'bold', fontSize: 20 }}>{label}</span>;
};
