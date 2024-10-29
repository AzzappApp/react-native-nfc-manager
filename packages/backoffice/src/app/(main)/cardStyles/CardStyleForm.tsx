'use client';

import { PhoneIphone } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  FormControlLabel,
  Link,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import omit from 'lodash/omit';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FontSelect from '#components/FontSelect';
import { intParser, useForm } from '#helpers/formHelpers';
import { saveCardStyle } from './cardStylesActions';
import type { CardStyleErrors } from './cardStyleSchema';
import type { CardStyle } from '@azzapp/data';

type CardStyleFormProps = {
  cardStyle?: CardStyle | null;
  saved?: boolean;
  label?: string | null;
};

const CardStyleForm = ({ cardStyle, saved, label }: CardStyleFormProps) => {
  const isCreation = !cardStyle;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<CardStyleErrors | null>(null);
  const { data, fieldProps } = useForm<CardStyle & { label: string }>(
    () => ({
      ...(cardStyle ?? { enabled: true }),
      label: label ?? undefined,
    }),
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
      const result = await saveCardStyle(data);
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
      component="form"
      onSubmit={handleSubmit}
    >
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/cardStyles"
        >
          <PhoneIphone sx={{ mr: 0.5 }} fontSize="inherit" />
          Styles
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {cardStyle ? `CardStyle ${label}` : 'New CardStyle'}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            name="enabled"
            checked={!!data.enabled}
            disabled={saving}
            {...omit(fieldProps('enabled'), 'error', 'helperText')}
          />
        }
        sx={{ mb: 2 }}
        label="Enabled"
      />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
        maxWidth={600}
      >
        <TextField
          name="label"
          label="Label (en-US)"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('label')}
        />
        <FontSelect
          name="fontFamily"
          label="Texts font family"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('fontFamily')}
        />
        <TextField
          name="fontSize"
          type="number"
          label="Texts font size"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('fontSize', { parse: intParser })}
        />
        <FontSelect
          name="titleFontFamily"
          label="Titles font family"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('titleFontFamily')}
        />
        <TextField
          name="titleFontSize"
          type="number"
          label="Titles font size"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('titleFontSize', { parse: intParser })}
        />
        <TextField
          name="borderRadius"
          type="number"
          label="Border Radius"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('borderRadius', { parse: intParser })}
        />
        <TextField
          name="borderWidth"
          type="number"
          label="Border Size"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('borderWidth', { parse: intParser })}
        />
        <TextField
          name="borderColor"
          label="Border Color"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('borderColor')}
        />
        <TextField
          name="buttonColor"
          label="Button Color"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('buttonColor')}
        />
        <TextField
          name="buttonRadius"
          type="number"
          label="Button Radius"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('buttonRadius', { parse: intParser })}
        />
        <TextField
          name="gap"
          type="number"
          label="Gap"
          disabled={saving}
          required
          sx={{ width: 250 }}
          {...fieldProps('gap', { parse: intParser })}
        />
      </Box>
      <div>
        <Button
          type="submit"
          variant="contained"
          sx={{ mb: 2 }}
          disabled={saving}
        >
          Save
        </Button>
        {error && (
          <Typography variant="body1" color="error">
            Something went wrong {error?.message}
          </Typography>
        )}
      </div>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="CardStyle saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CardStyleForm;
