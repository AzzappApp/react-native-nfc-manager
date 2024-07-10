'use client';

import { useInputControl } from '@conform-to/react';
import { MenuItem, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { FieldMetadata } from '@conform-to/react';
import type { ChangeEvent } from 'react';

type Position = { x: number; y: number };

type Props = {
  field: FieldMetadata<Position>;
};

const POSITIONS = new Array(101).fill(null).map((_, i) => i.toString());

const PositionInput = ({ field }: Props) => {
  const [position, setPosition] = useState<Position>({
    x: field.value?.x ? parseInt(field.value.x, 10) : 50,
    y: field.value?.y ? parseInt(field.value.y, 10) : 50,
  });
  const fields = field.getFieldset();

  const positionFieldX = useInputControl(fields.x);
  const positionFieldY = useInputControl(fields.y);

  const onChangePositionX = (event: ChangeEvent<HTMLInputElement>) => {
    const x = event.target.value;

    setPosition(prevPosition => ({
      y: prevPosition.y,
      x: parseInt(x, 10),
    }));

    positionFieldX.change(x);
  };

  const onChangePositionY = (event: ChangeEvent<HTMLInputElement>) => {
    const y = event.target.value;

    setPosition(prevPosition => ({
      x: prevPosition.x,
      y: parseInt(y, 10),
    }));

    positionFieldY.change(y);
  };

  return (
    <>
      <TextField
        label={'X'}
        sx={{ flex: 1 }}
        select
        required
        error={!!field.errors}
        onChange={onChangePositionX}
        value={position.x}
      >
        {POSITIONS.map(position => (
          <MenuItem key={position} value={position}>
            <Typography>{position}</Typography>
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={'Y'}
        sx={{ flex: 1 }}
        select
        required
        error={!!field.errors}
        onChange={onChangePositionY}
        value={position.y}
      >
        {POSITIONS.map(position => (
          <MenuItem key={position} value={position}>
            <Typography>{position}</Typography>
          </MenuItem>
        ))}
      </TextField>
    </>
  );
};

export default PositionInput;
