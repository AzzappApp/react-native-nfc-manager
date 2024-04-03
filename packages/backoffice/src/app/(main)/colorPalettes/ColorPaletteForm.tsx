'use client';

import {
  Box,
  Button,
  FormControlLabel,
  Snackbar,
  Switch,
  Typography,
} from '@mui/material';
import { omit } from 'lodash';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ColorInput from '#components/ColorInput';
import { useForm } from '#helpers/formHelpers';
import { saveColorPalette } from './colorPaletteActions';
import type { ColorPaletteErrors } from './colorPaletteSchema';
import type { ColorPalette } from '@azzapp/data';

type ColorPaletteFormProps = {
  colorPalette?: ColorPalette | null;
  saved?: boolean;
};

const ColorPaletteForm = ({
  colorPalette,
  saved = false,
}: ColorPaletteFormProps) => {
  const isCreation = !colorPalette;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<ColorPaletteErrors | null>(null);
  const { data, fieldProps } = useForm(
    () => colorPalette ?? ({ enabled: true } as Partial<ColorPalette>),
    formErrors?.fieldErrors,
    [colorPalette],
  );

  useEffect(() => {
    if (saved) {
      setDisplaySaveSuccess(true);
    }
  }, [saved]);

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await saveColorPalette(data as ColorPalette);
      if (result.success) {
        setFormErrors(null);
        if (isCreation) {
          router.replace(`/colorPalettes/${result.colorPaletteId}?saved=true`);
        } else {
          setDisplaySaveSuccess(true);
        }
      } else {
        setFormErrors(result.formErrors);
      }
    } catch (error) {
      setFormErrors(null);
      setError(error);
    }
    setIsSaving(false);
  };

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 10 }}>
        {colorPalette ? `ColorPalette ${colorPalette.id}` : 'New ColorPalette'}
      </Typography>
      {error && (
        <Typography variant="body1" color="error">
          Something went wrong {error?.message}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          padding: 2,
        }}
        maxWidth={500}
        component="form"
        onSubmit={handleSubmit}
      >
        <ColorInput
          name="primary"
          label="Primary color"
          required
          disabled={saving}
          {...fieldProps('primary')}
        />
        <ColorInput
          name="dark"
          label="Dark color"
          required
          disabled={saving}
          {...fieldProps('dark')}
        />
        <ColorInput
          name="light"
          label="Light color"
          required
          disabled={saving}
          {...fieldProps('light')}
        />
        <FormControlLabel
          control={
            <Switch
              name="enabled"
              checked={!!data.enabled}
              disabled={saving}
              {...omit(fieldProps('enabled'), 'error', 'helperText')}
            />
          }
          label="Enabled"
        />

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={saving}
        >
          Save
        </Button>
      </Box>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="ColorPalette saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default ColorPaletteForm;
