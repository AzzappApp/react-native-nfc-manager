'use client';

import { getInputProps, useInputControl } from '@conform-to/react';
import { MenuItem, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { COLOR_PALETTE_COLORS } from '@azzapp/shared/cardHelpers';
import type { FieldMetadata } from '@conform-to/react';
import type { ChangeEvent } from 'react';

type Props = {
  field: FieldMetadata<string>;
  label: string;
};

const ColorInput = ({ field, label }: Props) => {
  const [borderColor, setBorderColor] = useState(() => {
    if (!field.initialValue?.includes('#')) {
      return field.initialValue;
    }

    return 'custom';
  });
  const colorField = useInputControl(field);

  const onChangeColor = (event: ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setBorderColor(color);
    if (color !== 'custom') {
      colorField.change(event.target.value);
    } else {
      colorField.change('');
    }
  };

  return (
    <>
      <TextField
        label={label}
        sx={{ flex: 1 }}
        select
        error={!!field.errors}
        onChange={onChangeColor}
        value={borderColor}
      >
        <MenuItem value="custom">
          <Typography
            style={{
              textTransform: 'capitalize',
            }}
          >
            Custom
          </Typography>
        </MenuItem>
        {COLOR_PALETTE_COLORS.map(color => (
          <MenuItem key={color} value={color}>
            <Typography
              style={{
                textTransform: 'capitalize',
              }}
            >
              {color}
            </Typography>
          </MenuItem>
        ))}
      </TextField>
      {borderColor === 'custom' && (
        <TextField
          label="Custom Color"
          sx={{ flex: 1 }}
          error={!!field.errors}
          {...getInputProps(field, {
            type: 'text',
          })}
        />
      )}
    </>
  );
};

export default ColorInput;
