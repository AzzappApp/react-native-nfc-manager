import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  createFilterOptions,
} from '@mui/material';
import { useRef } from 'react';
import type { CardTemplateType, Label } from '@azzapp/data';
import type { BoxProps } from '@mui/material';

type WebCardTemplateTypeListInputProps = Omit<BoxProps, 'onChange'> & {
  name: string;
  label: string;
  value: CardTemplateType | string | null | undefined;
  options: CardTemplateType[];
  error?: boolean | null;
  helperText?: string | null;
  onChange: (value: CardTemplateType | string | null | undefined) => void;
  cardTemplateTypesLabels: Label[];
};

const WebCardTemplateTypeListInput = ({
  name,
  label,
  cardTemplateTypesLabels,
  value,
  error,
  options,
  helperText,
  onChange,
  ...props
}: WebCardTemplateTypeListInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleActivitySelect = (field: CardTemplateType | string | null) => {
    inputRef.current?.blur();
    if (!field) {
      return;
    }
    if (typeof field === 'string') {
      field = field.replace(ADD_CARDTEMPLATE_PREFIX, '');
    }
    onChange(field);
  };

  return (
    <Box {...props}>
      {error && <Typography color="error">{helperText}</Typography>}
      <Autocomplete
        value={value}
        multiple={false}
        options={options as Array<CardTemplateType | string>}
        getOptionLabel={option =>
          typeof option === 'string'
            ? option
            : cardTemplateTypesLabels.find(l => l.labelKey === option.labelKey)
                ?.baseLabelValue ?? option.labelKey
        }
        renderInput={params => (
          <TextField
            {...params}
            inputRef={inputRef}
            label="Add a default webcard template type"
            variant="outlined"
          />
        )}
        sx={{ width: 300 }}
        renderOption={(props, option) => {
          const id = typeof option === 'string' ? option : option.id;
          const label =
            typeof option === 'string'
              ? option
              : cardTemplateTypesLabels.find(
                  l => l.labelKey === option.labelKey,
                )?.baseLabelValue ?? option.labelKey;
          return (
            <li {...props} key={id}>
              {label}
            </li>
          );
        }}
        filterOptions={(options, params) => {
          const filtered = filterCardTemplateType(options, params);
          return filtered;
        }}
        onChange={(_, value) => handleActivitySelect(value)}
      />
    </Box>
  );
};

export default WebCardTemplateTypeListInput;

const filterCardTemplateType = createFilterOptions<CardTemplateType | string>();

const ADD_CARDTEMPLATE_PREFIX = 'Add card template Type : ';
