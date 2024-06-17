import { getInputProps, getSelectProps } from '@conform-to/react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { FILTERS } from '@azzapp/shared/filtersHelper';
import ColorInput from './ColorInput';
import ImageInput from './ImageInput';
import RadianInput from './RadianInput';
import type { CoverOverlaySchemaType } from './coverTemplateSchema';
import type { FieldMetadata } from '@conform-to/react';

type Props = {
  field: FieldMetadata<CoverOverlaySchemaType>;
};

const CoverOverlayForm = ({ field }: Props) => {
  const overlayFields = field.getFieldset();

  return (
    <Box display="flex" flexDirection="column" gap={2} width="100%">
      <input
        {...getInputProps(overlayFields.media.getFieldset().id, {
          type: 'hidden',
        })}
      />
      <ImageInput
        field={field.getFieldset().image}
        imageId={overlayFields.media.getFieldset().id.initialValue}
        buttonLabel={'add image'}
      />
      <Box display="flex" gap={2}>
        <FormControl
          fullWidth
          error={!!overlayFields.filter.errors}
          required
          sx={{ width: 300 }}
        >
          <InputLabel id="filter-label">Filter</InputLabel>
          <Select
            labelId={'filter-label'}
            label="Filter"
            {...getSelectProps(overlayFields.filter)}
          >
            {FILTERS.map(filter => (
              <MenuItem key={filter} value={filter}>
                <Typography>{filter}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box display="flex" gap={2}>
        <TextField
          label="Height"
          error={!!overlayFields.bounds.getFieldset().height.errors}
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '100',
          }}
          {...getInputProps(overlayFields.bounds.getFieldset().height, {
            type: 'number',
          })}
        />
        <TextField
          label="Width"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '100',
          }}
          error={!!overlayFields.bounds.getFieldset().width.errors}
          {...getInputProps(overlayFields.bounds.getFieldset().width, {
            type: 'number',
          })}
        />
        <RadianInput field={overlayFields.rotation} label="Orientation" />
        <TextField
          label="X"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '100',
          }}
          error={!!overlayFields.bounds.getFieldset().x.errors}
          {...getInputProps(overlayFields.bounds.getFieldset().x, {
            type: 'number',
          })}
        />
        <TextField
          label="Y"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '100',
          }}
          error={!!overlayFields.bounds.getFieldset().y.errors}
          {...getInputProps(overlayFields.bounds.getFieldset().y, {
            type: 'number',
          })}
        />
      </Box>
      <Box display="flex" gap={2}>
        <TextField
          label="Border size"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '100',
          }}
          error={!!overlayFields.borderWidth.errors}
          {...getInputProps(overlayFields.borderWidth, {
            type: 'number',
          })}
        />
        <ColorInput field={overlayFields.borderColor} label="Boder Color" />
        <TextField
          label="Border radius"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '100',
          }}
          error={!!overlayFields.borderRadius.errors}
          {...getInputProps(overlayFields.borderRadius, {
            type: 'number',
          })}
        />
      </Box>
      {/* <Box display="flex" gap={2}>
        <FormControl
          fullWidth
          error={!!overlayFields.animation.errors}
          sx={{ flex: 1 }}
        >
          <InputLabel id="animation-label">Animation</InputLabel>
          <Select
            labelId={'animation-label'}
            label="Animation"
            {...getSelectProps(overlayFields.animation)}
          >
            {textAnimations.map(animation => (
              <MenuItem key={animation} value={animation}>
                <Typography>{animation}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start"
          sx={{ flex: 1 }}
          {...getInputProps(overlayFields.start, {
            type: 'number',
          })}
        />
        <TextField
          label="End"
          sx={{ flex: 1 }}
          {...getInputProps(overlayFields.end, {
            type: 'number',
          })}
        />
      </Box> */}
    </Box>
  );
};

export default CoverOverlayForm;
