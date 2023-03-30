import { SaveButton, SimpleForm, TextInput, Toolbar } from 'react-admin';
import SectionTitle from '#components/SectionTitle';

export const validateForm = (
  values: Record<string, any>,
): Record<string, any> => {
  const errors = {} as any;
  if (!values.tag) {
    errors.tag = 'Tag is required';
  }
  if (!values.labels?.en) {
    errors['labels.en'] = 'Label is required';
  }
  return errors;
};

const InterestForm = () => (
  <SimpleForm
    validate={validateForm}
    toolbar={
      <Toolbar>
        <SaveButton label="Save" />
      </Toolbar>
    }
  >
    <div style={{ display: 'list-item', flexDirection: 'row' }}>
      <SectionTitle label="Tag" />
      <div>
        <TextInput
          source="tag"
          fullWidth
          helperText="User for search algorithm."
        />
      </div>

      <SectionTitle label="Label" />
      <div>
        <TextInput
          source="labels.en"
          fullWidth
          helperText="Displayed to user."
        />
      </div>
    </div>
  </SimpleForm>
);

export default InterestForm;
