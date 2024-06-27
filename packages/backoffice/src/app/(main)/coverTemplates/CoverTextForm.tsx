import {
  getInputProps,
  getSelectProps,
  useInputControl,
} from '@conform-to/react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  COVER_MAX_FONT_SIZE,
  COVER_MIN_FONT_SIZE,
} from '@azzapp/shared/coverHelpers';
import { APPLICATIONS_FONTS } from '@azzapp/shared/fontHelpers';
import ColorInput from './ColorInput';
import { textAnimations } from './constants';
import RadianInput from './RadianInput';
import type { TextSchemaType } from './coverTemplateSchema';
import type { CoverTextType } from '@azzapp/data/coverTemplates';
import type { FieldMetadata } from '@conform-to/react';
import type { ChangeEvent } from 'react';

type TextFormProps = {
  field: FieldMetadata<TextSchemaType>;
};

const CoverTextForm = ({ field }: TextFormProps) => {
  const textFields = field.getFieldset();
  const [text, setText] = useState<CoverTextType>(
    (textFields.text.value as CoverTextType) || 'mainName',
  );
  const textField = useInputControl(textFields.text);

  const onChangeText = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value as CoverTextType);
    textField.change(event.target.value);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
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
        <FormControl
          fullWidth
          error={!!textFields.fontSize.errors}
          required
          sx={{ flex: 1 }}
        >
          <InputLabel id="size-label">Size</InputLabel>
          <Select
            labelId={'size-label'}
            label="Size"
            {...getSelectProps(textFields.fontSize)}
            key={textFields.fontSize.key}
          >
            {[
              ...Array(COVER_MAX_FONT_SIZE - COVER_MIN_FONT_SIZE + 1).keys(),
            ].map(size => (
              <MenuItem key={size} value={size + COVER_MIN_FONT_SIZE}>
                <Typography>{size + COVER_MIN_FONT_SIZE}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Width"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '1',
            max: '100',
            defaultValue: textFields.width.initialValue || '1',
          }}
          error={!!textFields.width.errors}
          {...getInputProps(textFields.width, {
            type: 'number',
          })}
          key={textFields.width.key}
        />
        <RadianInput field={textFields.orientation} label="Orientation" />
        <TextField
          label="X"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '0',
            max: '100',
            defaultValue:
              textFields.position.getFieldset().x.initialValue || '0',
          }}
          error={!!textFields.position.getFieldset().x.errors}
          {...getInputProps(textFields.position.getFieldset().x, {
            type: 'number',
          })}
          key={textFields.position.key}
        />
        <TextField
          label="Y"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '0',
            max: '100',
            defaultValue:
              textFields.position.getFieldset().y.initialValue || '0',
          }}
          error={!!textFields.position.getFieldset().y.errors}
          {...getInputProps(textFields.position.getFieldset().y, {
            type: 'number',
          })}
          key={textFields.position.getFieldset().y.key}
        />
      </Box>
      <Box display="flex" gap={2}>
        <FormControl
          fullWidth
          error={!!textFields.animation.getFieldset().name.errors}
          sx={{ flex: 1 }}
        >
          <InputLabel id="animation-label">Animation</InputLabel>
          <Select
            labelId={'animation-label'}
            label="Animation"
            {...getSelectProps(textFields.animation.getFieldset().name)}
            key={textFields.animation.getFieldset().name.key}
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
          error={!!textFields.animation.getFieldset().start.errors}
          required
          inputProps={{
            min: '0',
            max: '100',
            defaultValue:
              textFields.animation.getFieldset().start.initialValue || '0',
          }}
          {...getInputProps(textFields.animation.getFieldset().start, {
            type: 'number',
          })}
          key={textFields.animation.getFieldset().start.key}
        />
        <TextField
          label="End"
          sx={{ flex: 1 }}
          required
          inputProps={{
            min: '0',
            max: '100',
            defaultValue:
              textFields.animation.getFieldset().end.initialValue || '0',
          }}
          error={!!textFields.animation.getFieldset().end.errors}
          {...getInputProps(textFields.animation.getFieldset().end, {
            type: 'number',
          })}
          key={textFields.animation.getFieldset().end.key}
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
