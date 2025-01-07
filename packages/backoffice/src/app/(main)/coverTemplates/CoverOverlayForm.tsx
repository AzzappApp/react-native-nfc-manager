import {
  getInputProps,
  getSelectProps,
  useInputControl,
} from '@conform-to/react';
import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { FILTERS } from '@azzapp/shared/filtersHelper';
import ColorInput from './ColorInput';
import { overlayAnimations } from './constants';
import RadianInput from './RadianInput';
import type { CoverOverlaySchemaType } from './coverTemplateSchema';
import type { FieldMetadata } from '@conform-to/react';
import type { ChangeEvent } from 'react';

type Props = {
  field: FieldMetadata<CoverOverlaySchemaType>;
};

const CoverOverlayForm = ({ field }: Props) => {
  const overlayFields = field.getFieldset();
  const [haveShadow, setShadow] = useState(
    !!overlayFields.shadow.initialValue || false,
  );

  const shadowField = useInputControl(overlayFields.shadow);

  const toggleShadow = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setShadow(event.target.checked);
      shadowField.change(event.target.checked ? 'true' : '');
    },
    [shadowField],
  );

  return (
    <Box display="flex" flexDirection="column" gap={2} width="100%">
      <input
        {...getInputProps(overlayFields.media.getFieldset().id, {
          type: 'hidden',
        })}
        key={overlayFields.media.getFieldset().id.key}
      />
      <Box display="flex" gap={2}>
        <FormControl
          fullWidth
          error={!!overlayFields.filter.errors}
          sx={{ width: 300 }}
        >
          <InputLabel id="filter-label">Filter</InputLabel>
          <Select
            labelId="filter-label"
            label="Filter"
            {...getSelectProps(overlayFields.filter)}
            key={overlayFields.filter.key}
          >
            <MenuItem key="FilterNone" value="">
              <em>No Filter</em>
            </MenuItem>
            {FILTERS.map(filter => (
              <MenuItem key={filter} value={filter}>
                <Typography>{filter}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={haveShadow} onChange={toggleShadow} />}
          label="Shadow"
        />
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
            step: 'any',
            defaultValue:
              overlayFields.bounds.getFieldset().height.initialValue || '1',
          }}
          {...getInputProps(overlayFields.bounds.getFieldset().height, {
            type: 'number',
          })}
          key={overlayFields.bounds.getFieldset().height.key}
        />
        <TextField
          label="Width"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '100',
            step: 'any',
            defaultValue:
              overlayFields.bounds.getFieldset().width.initialValue || '1',
          }}
          error={!!overlayFields.bounds.getFieldset().width.errors}
          {...getInputProps(overlayFields.bounds.getFieldset().width, {
            type: 'number',
          })}
          key={overlayFields.bounds.getFieldset().width.key}
        />
        <RadianInput field={overlayFields.rotation} label="Orientation" />
        <TextField
          label="X"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '0',
            max: '100',
            step: 'any',
            defaultValue:
              overlayFields.bounds.getFieldset().x.initialValue || '0',
          }}
          error={!!overlayFields.bounds.getFieldset().x.errors}
          {...getInputProps(overlayFields.bounds.getFieldset().x, {
            type: 'number',
          })}
          key={overlayFields.bounds.getFieldset().x.key}
        />
        <TextField
          label="Y"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '0',
            max: '100',
            step: 'any',
            defaultValue:
              overlayFields.bounds.getFieldset().y.initialValue || '0',
          }}
          error={!!overlayFields.bounds.getFieldset().y.errors}
          {...getInputProps(overlayFields.bounds.getFieldset().y, {
            type: 'number',
          })}
          key={overlayFields.bounds.getFieldset().y.key}
        />
      </Box>
      <Box display="flex" gap={2}>
        <TextField
          label="Border size"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '0',
            max: '100',
            step: 'any',
            defaultValue: overlayFields.borderWidth.initialValue || '0',
          }}
          error={!!overlayFields.borderWidth.errors}
          {...getInputProps(overlayFields.borderWidth, {
            type: 'number',
          })}
          key={overlayFields.borderWidth.key}
        />
        <ColorInput field={overlayFields.borderColor} label="Boder Color" />
        <TextField
          label="Border radius"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '0',
            max: '100',
            step: 'any',
            defaultValue: overlayFields.borderRadius.initialValue || '0',
          }}
          error={!!overlayFields.borderRadius.errors}
          {...getInputProps(overlayFields.borderRadius, {
            type: 'number',
          })}
          key={overlayFields.borderRadius.key}
        />
      </Box>
      <Box display="flex" gap={2}>
        <FormControl
          fullWidth
          error={!!overlayFields.animation.errors}
          sx={{ flex: 1 }}
        >
          <InputLabel id="animation-label">Animation</InputLabel>
          <Select
            labelId="animation-label"
            label="Animation"
            {...getSelectProps(overlayFields.animation)}
            key={overlayFields.animation.key}
          >
            <MenuItem key="AnimationNone" value="">
              <em>No Animation</em>
            </MenuItem>
            {overlayAnimations.map(animation => (
              <MenuItem key={animation} value={animation}>
                <Typography>{animation}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start"
          sx={{ flex: 1 }}
          {...getInputProps(overlayFields.startPercentageTotal, {
            type: 'number',
          })}
          key={overlayFields.startPercentageTotal.key}
          inputProps={{
            min: '0',
            max: '100',
            step: 'any',
            defaultValue:
              overlayFields.startPercentageTotal.initialValue || '0',
          }}
        />
        <TextField
          label="End"
          sx={{ flex: 1 }}
          {...getInputProps(overlayFields.endPercentageTotal, {
            type: 'number',
          })}
          key={overlayFields.endPercentageTotal.key}
          inputProps={{
            min: '0',
            max: '100',
            step: 'any',
            defaultValue:
              overlayFields.endPercentageTotal.initialValue || '100',
          }}
        />
      </Box>
    </Box>
  );
};

export default CoverOverlayForm;
