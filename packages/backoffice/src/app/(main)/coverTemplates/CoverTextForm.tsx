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
import { APPLICATIONS_FONTS } from '@azzapp/shared/fontHelpers';
import ColorInput from './ColorInput';
import { textAnimations } from './constants';
import PositionInput from './PositionInput';
import RadianInput from './RadianInput';
import SizeInput from './SizeInput';
import type { TextSchemaType } from './coverTemplateSchema';
import type { CoverTextType } from '@azzapp/data';
import type { FieldMetadata } from '@conform-to/react';
import type { ChangeEvent } from 'react';

type TextFormProps = {
  field: FieldMetadata<TextSchemaType>;
};

const CoverTextForm = ({ field }: TextFormProps) => {
  const textFields = field.getFieldset();
  const [haveShadow, setShadow] = useState(
    !!textFields.shadow.initialValue || false,
  );
  const [text, setText] = useState<CoverTextType>(
    (textFields.text.value as CoverTextType) || 'mainName',
  );

  const shadowField = useInputControl(textFields.shadow);
  const textField = useInputControl(textFields.text);

  const onChangeText = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value as CoverTextType);
    textField.change(event.target.value);
  };

  const toggleShadow = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setShadow(event.target.checked);
      shadowField.change(event.target.checked ? 'true' : '');
    },
    [shadowField],
  );

  return (
    <Box display="flex" flexDirection="column" gap={2} width="100%">
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={haveShadow}
              {...getInputProps(textFields.shadow, {
                type: 'checkbox',
              })}
              key={textFields.shadow.key}
              onChange={toggleShadow}
            />
          }
          label="Shadow"
        />
      </Box>
      <Box display="flex" gap={2}>
        <TextField
          label="Label"
          sx={{ flex: 1 }}
          select
          required
          defaultValue={text}
          error={!!textFields.text.errors}
          {...getInputProps(textFields.text, {
            type: 'text',
          })}
          key={textFields.text.key}
          onChange={onChangeText}
        >
          <MenuItem key={'firstName'} value={'firstName'}>
            <Typography>First name</Typography>
          </MenuItem>
          <MenuItem key={'mainName'} value={'mainName'}>
            <Typography>Last name / Company name / name</Typography>
          </MenuItem>
          <MenuItem key={'custom'} value={'custom'}>
            <Typography>Custom label</Typography>
          </MenuItem>
        </TextField>
        <TextField
          label="Custom label"
          sx={{ flex: 1 }}
          required
          disabled={text !== 'custom'}
          error={!!textFields.customText.errors}
          {...getInputProps(textFields.customText, {
            type: 'text',
          })}
          key={textFields.customText.key}
        />
        <FormControl
          fullWidth
          error={!!textFields.fontFamily.errors}
          required
          sx={{ flex: 1 }}
        >
          <InputLabel id="fontFamily-label">Font family</InputLabel>
          <Select
            labelId={'fontFamily-label'}
            label="Font family"
            {...getSelectProps(textFields.fontFamily)}
            key={textFields.fontFamily.key}
          >
            {APPLICATIONS_FONTS.map(font => (
              <MenuItem key={font} value={font}>
                <Typography
                  style={{
                    textTransform: 'capitalize',
                  }}
                >
                  {font}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box display="flex" gap={2}>
        <ColorInput field={textFields.color} label="Color" />
        <SizeInput field={textFields.fontSize} />
        <TextField
          label="Width"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '200',
            step: 'any',
            defaultValue: textFields.width.initialValue || '1',
          }}
          error={!!textFields.width.errors}
          {...getInputProps(textFields.width, {
            type: 'number',
          })}
          key={textFields.width.key}
        />
        <RadianInput field={textFields.rotation} label="Orientation" />
        <PositionInput field={textFields.position} />
      </Box>
      <Box display="flex" gap={2}>
        <FormControl
          fullWidth
          error={!!textFields.animation.errors}
          sx={{ flex: 1 }}
        >
          <InputLabel id="animation-label">Animation</InputLabel>
          <Select
            labelId={'animation-label'}
            label="Animation"
            {...getSelectProps(textFields.animation)}
            key={textFields.animation.key}
          >
            <MenuItem key="AnimationNone" value="">
              <em>No Animation</em>
            </MenuItem>
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
          error={!!textFields.startPercentageTotal.errors}
          required
          inputProps={{
            min: '0',
            max: '100',
            step: 'any',
            defaultValue: textFields.startPercentageTotal.initialValue || '0',
          }}
          {...getInputProps(textFields.startPercentageTotal, {
            type: 'number',
          })}
          key={textFields.startPercentageTotal.key}
        />
        <TextField
          label="End"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '0',
            max: '100',
            step: 'any',
            defaultValue: textFields.endPercentageTotal.initialValue || '100',
          }}
          error={!!textFields.endPercentageTotal.errors}
          {...getInputProps(textFields.endPercentageTotal, {
            type: 'number',
          })}
          key={textFields.endPercentageTotal.key}
        />
        <TextField
          label="Text align"
          sx={{ flex: 1 }}
          select
          required
          defaultValue={'left'}
          error={!!textFields.textAlign.errors}
          {...getInputProps(textFields.textAlign, {
            type: 'text',
          })}
          key={textFields.textAlign.key}
        >
          <MenuItem key={'left'} value={'left'}>
            <Typography>Left</Typography>
          </MenuItem>
          <MenuItem key={'right'} value={'right'}>
            <Typography>Right</Typography>
          </MenuItem>
          <MenuItem key={'center'} value={'center'}>
            <Typography>Center</Typography>
          </MenuItem>
        </TextField>
      </Box>
    </Box>
  );
};

export default CoverTextForm;
