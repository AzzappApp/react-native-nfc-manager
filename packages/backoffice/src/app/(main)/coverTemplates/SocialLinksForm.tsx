import { getSelectProps } from '@conform-to/react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { SOCIAL_LINKS } from '@azzapp/shared/socialLinkHelpers';
import ColorInput from './ColorInput';
import PositionInput from './PositionInput';
import SizeInput from './SizeInput';
import type {
  CoverTemplateFormValue,
  SocialLinksSchemaType,
} from './coverTemplateSchema';
import type { FieldMetadata, FormMetadata } from '@conform-to/react';

type Props = {
  form: FormMetadata<CoverTemplateFormValue>;
  field: FieldMetadata<SocialLinksSchemaType>;
};

const SocialLinksForm = ({ form, field }: Props) => {
  const socialLinksFields = field.getFieldset();

  return (
    <Box display="flex" flexDirection="column" gap={2} width="100%">
      <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
        Social links
      </Typography>

      <Box display="flex" gap={2}>
        <ColorInput field={socialLinksFields.color} label="Color" />
        <PositionInput field={socialLinksFields.position} />
        <SizeInput field={socialLinksFields.size} />
      </Box>

      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" gap={2}>
          {socialLinksFields.links.getFieldList().map((linkField, index) => (
            <FormControl key={linkField.id} fullWidth sx={{ flex: 1 }}>
              <InputLabel id={linkField.id}>Link {index + 1}</InputLabel>
              <Select
                labelId={linkField.id}
                label={`Link ${index}`}
                {...getSelectProps(linkField)}
                key={linkField.key}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {SOCIAL_LINKS.map(({ id }) => (
                  <MenuItem key={id} value={id}>
                    <Typography
                      style={{
                        textTransform: 'capitalize',
                      }}
                    >
                      {id}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
        <Box display="flex" gap={2}>
          <Button
            type="submit"
            variant="contained"
            {...form.insert.getButtonProps({
              name: socialLinksFields.links.name,
            })}
          >
            Add link
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            {...form.remove.getButtonProps({
              name: socialLinksFields.links.name,
              index: (socialLinksFields.links.value?.length || 1) - 1,
            })}
          >
            Remove link
          </Button>
        </Box>
        {socialLinksFields.links.errors && (
          <Typography color="error">
            {socialLinksFields.links.errors}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SocialLinksForm;
