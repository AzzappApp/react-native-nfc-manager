import * as React from 'react';
import {
  SimpleForm,
  TextInput,
  RadioButtonGroupInput,
  Edit,
  FunctionField,
  BooleanInput,
  Toolbar,
  SaveButton,
} from 'react-admin';
import CloudinaryImageField from '#components/CloudinaryImageField';
import SectionTitle from '#components/SectionTitle';

const validateForm = (values: Record<string, any>): Record<string, any> => {
  const errors = {} as any;
  if (!values.name) {
    errors.name = 'Name is required';
  }

  return errors;
};

const StaticMediaEdit = () => {
  const transform = async (data: any) => {
    return { ...data };
  };

  return (
    <Edit
      transform={transform}
      aside={
        <FunctionField
          render={(record: any) => {
            return (
              <div
                style={{
                  order: -1,
                  flex: 1,
                  marginTop: 65,
                  marginLeft: 10,
                  marginRight: 10,
                  alignSelf: 'flex-start',
                  backgroundColor: 'white',
                  borderRadius: 4,
                  borderColor: 'rgb(128,128,128)',
                  boxShadow:
                    '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
                }}
              >
                <CloudinaryImageField id={record?.id} height={300} />
              </div>
            );
          }}
        />
      }
    >
      <SimpleForm
        validate={validateForm}
        warnWhenUnsavedChanges
        toolbar={
          <Toolbar>
            <SaveButton label="Save" />
          </Toolbar>
        }
      >
        <SectionTitle label="Cover Layer available to user" />
        <BooleanInput source="available" />
        <TextInput
          source="name"
          fullWidth
          helperText="Used for internal use only. (admin panel)"
        />
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
      </SimpleForm>
    </Edit>
  );
};

export default StaticMediaEdit;
