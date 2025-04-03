import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  createFilterOptions,
} from '@mui/material';
import { useRef } from 'react';
import type { CardTemplateType, LocalizationMessage } from '@azzapp/data';
import type { BoxProps } from '@mui/material';

type Value = CardTemplateType | string | null | undefined;

type TypeListInput = Omit<BoxProps, 'onChange'> & {
  name: string;
  label: string;
  value: Value;
  options: CardTemplateType[];
  error?: boolean | null;
  helperText?: string | null;
  onChange: (value: Value) => void;
  typesLabels: LocalizationMessage[];
};

const TypeListInput = ({
  name,
  label,
  typesLabels,
  value,
  error,
  options,
  helperText,
  onChange,
  ...props
}: TypeListInput) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleActivitySelect = (field: typeof value) => {
    inputRef.current?.blur();
    if (!field) {
      return;
    }
    if (typeof field === 'string') {
      field = field.replace(ADD_PREFIX, '');
    }
    onChange(field);
  };

  return (
    <Box {...props}>
      {error && <Typography color="error">{helperText}</Typography>}
      <Autocomplete
        value={value}
        fullWidth
        multiple={false}
        options={options as Array<CardTemplateType | string>}
        getOptionLabel={option =>
          typeof option === 'string'
            ? option
            : (typesLabels.find(l => l.key === option.id)?.value ?? option.id)
        }
        renderInput={params => (
          <TextField
            {...params}
            inputRef={inputRef}
            label={label}
            variant="outlined"
            fullWidth
          />
        )}
        renderOption={(props, option) => {
          const id = typeof option === 'string' ? option : option.id;
          const label =
            typeof option === 'string'
              ? option
              : (typesLabels.find(l => l.key === option.id)?.value ??
                option.id);
          return (
            <li {...props} key={id}>
              {label}
            </li>
          );
        }}
        filterOptions={(options, params) => {
          const filtered = filterType(options, params);
          return filtered;
        }}
        onChange={(_, value) => handleActivitySelect(value)}
      />
    </Box>
  );
};

export default TypeListInput;

const filterType = createFilterOptions<CardTemplateType | string>();

const ADD_PREFIX = 'Add type : ';
