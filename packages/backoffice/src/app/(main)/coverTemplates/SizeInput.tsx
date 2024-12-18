'use client';

import { getInputProps, useInputControl } from '@conform-to/react';
import { MenuItem, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { FieldMetadata } from '@conform-to/react';
import type { ChangeEvent } from 'react';

type Props = {
  field: FieldMetadata<number>;
};

const SIZES = new Array(122).fill(null).map((_, i) => (i + 6).toString());
const DEFAULT = 24;

const SizeInput = ({ field }: Props) => {
  const [size, setSize] = useState(
    field.value ? parseInt(field.value, 10) : DEFAULT,
  );
  const sizeField = useInputControl(field);

  const onChangeSize = (event: ChangeEvent<HTMLInputElement>) => {
    const size = event.target.value;

    setSize(parseInt(size, 10));

    sizeField.change(size);
  };

  return (
    <>
      <TextField
        label="Size"
        sx={{ flex: 1 }}
        select
        required
        error={!!field.errors}
        {...getInputProps(field, { type: 'number' })}
        key={field.key}
        onChange={onChangeSize}
        value={size}
      >
        {SIZES.map(size => (
          <MenuItem key={size} value={size}>
            <Typography>{size}</Typography>
          </MenuItem>
        ))}
      </TextField>
    </>
  );
};

export default SizeInput;
