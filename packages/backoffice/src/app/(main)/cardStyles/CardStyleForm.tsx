'use client';

import {
  Box,
  Button,
  FormControlLabel,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { omit } from 'lodash';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FontSelect from '#components/FontSelect';
import { intParser, labelsOptions, useForm } from '#helpers/formHelpers';
import { saveCardStyle } from './cardStylesActions';
import type { CardStyleErrors } from './cardStyleSchema';
import type { CardStyle } from '@azzapp/data/domains';

type CardStyleFormProps = {
  cardStyle?: CardStyle | null;
  saved?: boolean;
};

const CardStyleForm = ({ cardStyle, saved }: CardStyleFormProps) => {
  const isCreation = !cardStyle;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<CardStyleErrors | null>(null);
  const { data, fieldProps } = useForm(
    () => cardStyle ?? ({ enabled: true } as Partial<CardStyle>),
    formErrors?.fieldErrors,
    [cardStyle],
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
      const result = await saveCardStyle(data as CardStyle);
      if (result.success) {
        setFormErrors(null);
        if (isCreation) {
          router.replace(`/cardStyles/${result.cardStyleId}?saved=true`);
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
        {cardStyle ? `CardStyle ${cardStyle.labels.en}` : 'New CardStyle'}
      </Typography>
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
        <TextField
          name="label"
          label="Label"
          disabled={saving}
          required
          {...fieldProps('labels', labelsOptions)}
        />
        <FontSelect
          name="fontFamily"
          label="Texts font family"
          disabled={saving}
          required
          {...fieldProps('fontFamily')}
        />
        <TextField
          name="fontSize"
          type="number"
          label="Texts font size"
          disabled={saving}
          required
          {...fieldProps('fontSize', { parse: intParser })}
        />
        <FontSelect
          name="titleFontFamily"
          label="Titles font family"
          disabled={saving}
          required
          {...fieldProps('titleFontFamily')}
        />
        <TextField
          name="titleFontSize"
          type="number"
          label="Titles font size"
          disabled={saving}
          required
          {...fieldProps('titleFontSize', { parse: intParser })}
        />
        <TextField
          name="borderRadius"
          type="number"
          label="Border Radius"
          disabled={saving}
          required
          {...fieldProps('borderRadius', { parse: intParser })}
        />
        <TextField
          name="borderWidth"
          type="number"
          label="Border Size"
          disabled={saving}
          required
          {...fieldProps('borderWidth', { parse: intParser })}
        />
        <TextField
          name="borderColor"
          label="Border Color"
          disabled={saving}
          required
          {...fieldProps('borderColor')}
        />
        <TextField
          name="buttonColor"
          label="Button Color"
          disabled={saving}
          required
          {...fieldProps('buttonColor')}
        />
        <TextField
          name="buttonRadius"
          type="number"
          label="Button Radius"
          disabled={saving}
          required
          {...fieldProps('buttonRadius', { parse: intParser })}
        />
        <TextField
          name="gap"
          type="number"
          label="Gap"
          disabled={saving}
          required
          {...fieldProps('gap', { parse: intParser })}
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
        {error && (
          <Typography variant="body1" color="error">
            Something went wrong {error?.message}
          </Typography>
        )}
      </Box>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="CardStyle saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default CardStyleForm;
