import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Card,
} from '@mui/material';
import { getImageURL } from '@azzapp/service/mediaServices/imageHelpers';
import type { ModuleBackground } from '@azzapp/data';

type ModuleBackgroundSelectionListProps = {
  value: string | null | undefined;
  onChange: (value: string | null | undefined) => void;
  error?: boolean;
  helperText?: string | null;
  label: string;
  moduleBackgrounds: ModuleBackground[];
};

const ModuleBackgroundSelectionList = ({
  value,
  onChange,
  error,
  helperText,
  label,
  moduleBackgrounds,
}: ModuleBackgroundSelectionListProps) => (
  <FormControl error={error}>
    <FormLabel>{label}</FormLabel>
    <Card
      sx={{
        display: 'flex',
        overflow: 'auto',
        flexWrap: 'wrap',
        gap: 2,
        height: 400,
        padding: 2,
      }}
      role="listbox"
    >
      {moduleBackgrounds.map(moduleBackground => (
        <Box
          component="button"
          type="button"
          aria-selected={value === moduleBackground.id}
          key={moduleBackground.id}
          sx={{
            width: 120,
            height: 120,
            backgroundColor:
              value === moduleBackground.id ? 'primary.main' : 'transparent',
            border: '1px solid #000',
          }}
          onClick={() =>
            onChange(value === moduleBackground.id ? null : moduleBackground.id)
          }
        >
          <img
            src={getImageURL(moduleBackground.id)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
      ))}
    </Card>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

export default ModuleBackgroundSelectionList;
