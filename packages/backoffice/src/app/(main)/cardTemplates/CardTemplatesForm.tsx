'use client';

import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { omit } from 'lodash';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { labelsOptions, useForm } from '#helpers/formHelpers';
import { getModulesData, saveCardTemplate } from './cardTemplatesActions';
import type {
  CardTemplateErrors,
  CardTemplateFormValue,
} from './cardTemplateSchema';
import type {
  CardStyle,
  CardTemplate,
  CompanyActivity,
  ProfileCategory,
} from '@azzapp/data/domains';

type CoverTemplateFormProps = {
  cardTemplate?: CardTemplate;
  profileCategories: ProfileCategory[];
  companyActivities: CompanyActivity[];
  templateActivities?: string[] | null;
  templateCategories?: string[] | null;
  cardStyles: CardStyle[];
};

const CardTemplateForm = ({
  profileCategories,
  companyActivities,
  cardStyles,
  cardTemplate,
  templateActivities,
  templateCategories,
}: CoverTemplateFormProps) => {
  const [profileUserName, setProfileUserName] = useState<string | null>(null);
  const [modulesLoading, loadModules] = useTransition();
  const [modulesError, setModulesError] = useState<string | null>(null);

  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<CardTemplateErrors | null>(null);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(false);

  const { data, setData, fieldProps } = useForm<CardTemplateFormValue>(
    () => {
      if (cardTemplate) {
        return {
          labels: cardTemplate.labels,
          cardStyle: cardTemplate.cardStyleId!,
          modules: cardTemplate.modules,
          businessEnabled: cardTemplate.businessEnabled,
          personalEnabled: cardTemplate.personalEnabled,
          profileCategories: templateCategories,
          companyActivities: templateActivities,
        };
      }
      return {
        businessEnabled: true,
        personalEnabled: true,
      };
    },
    error?.fieldErrors,
    [],
  );

  const handleFetchModules = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (modulesLoading || !profileUserName) return;

    loadModules(async () => {
      setModulesError(null);
      const modulesData = await getModulesData(profileUserName);
      if (!modulesData)
        setModulesError(
          `Unable to find modules related to profile ${profileUserName}`,
        );
      else {
        const modules = modulesData;
        setData({
          ...data,
          modules,
        });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startSaving(async () => {
      setError(null);

      const { success, formErrors } = await saveCardTemplate(
        data,
        cardTemplate?.id,
      );

      if (!success) setError(formErrors);
      else setDisplaySaveSuccess(true);
    });
  };

  const fields = {
    label: fieldProps('labels', labelsOptions),
    profileCategories: fieldProps('profileCategories', {
      parse: (value: ProfileCategory[]) =>
        value.map((category: any) => category.id),
      format: (value: string[] | null | undefined) => {
        return convertToNonNullArray(
          value?.map(
            profileCategoryId =>
              profileCategories.find(
                category => category.id === profileCategoryId ?? null,
              ) ?? null,
          ) ?? [],
        );
      },
    }),
    companyActivities: fieldProps('companyActivities', {
      parse: (value: CompanyActivity[] | null | undefined) =>
        value?.map(activity => activity.id) ?? [],
      format: (value: string[] | null | undefined) => {
        return convertToNonNullArray(
          value?.map(
            activityId =>
              companyActivities.find(
                activity => activity.id === activityId ?? null,
              ) ?? null,
          ) ?? [],
        );
      },
    }),
    cardStyle: fieldProps('cardStyle'),
    businessEnabled: fieldProps('businessEnabled'),
    personalEnabled: fieldProps('personalEnabled'),
  };

  return (
    <div>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {cardTemplate
          ? `CardTemplate : ${cardTemplate.labels.en}`
          : 'New CardTemplate'}
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
        onSubmit={handleFetchModules}
      >
        <Typography variant="h6" component="h6">
          Modules{' '}
          {data.modules && (
            <Link
              target="_blank"
              href={`${process.env.NEXT_PUBLIC_FRONTEND}/${profileUserName}`}
            >
              ({data.modules.length})
            </Link>
          )}
        </Typography>
        <TextField
          name="baseProfileUserName"
          label="Profile name"
          required
          onChange={e => setProfileUserName(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Load
        </Button>
        {error?.fieldErrors.modules && (
          <Typography variant="body1" color="error">
            Missing modules
          </Typography>
        )}
        {modulesError && (
          <Typography variant="body1" color="error">
            {modulesError}
          </Typography>
        )}
      </Box>
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
        <Typography variant="h6" component="h6">
          General
        </Typography>
        <TextField name="label" label="Label" required {...fields.label} />
        <FormControl fullWidth error={fields.profileCategories.error}>
          <Autocomplete
            multiple
            id="profile-categories"
            options={profileCategories}
            getOptionLabel={option => option.labels.en}
            value={fields.profileCategories.value}
            onChange={(_, value) => fields.profileCategories.onChange(value)}
            renderInput={params => (
              <TextField
                {...params}
                variant="standard"
                label="Profile categories"
              />
            )}
            renderOption={(props, option) => {
              const label = option.labels.en;
              return (
                <li {...props} key={option.id}>
                  {label}
                </li>
              );
            }}
          />
          <FormHelperText>{fields.profileCategories.helperText}</FormHelperText>
        </FormControl>
        <FormControl fullWidth error={fields.companyActivities.error}>
          <Autocomplete
            multiple
            id="profile-categories"
            options={companyActivities}
            getOptionLabel={option => option.labels.en}
            value={fields.companyActivities.value}
            onChange={(_, value) => fields.companyActivities.onChange(value)}
            renderInput={params => (
              <TextField
                {...params}
                variant="standard"
                label="Company activities"
              />
            )}
            renderOption={(props, option) => {
              const label = option.labels.en;
              return (
                <li {...props} key={option.id}>
                  {label}
                </li>
              );
            }}
          />
          <FormHelperText>{fields.companyActivities.helperText}</FormHelperText>
        </FormControl>
        <FormControl fullWidth error={fields.cardStyle.error}>
          <InputLabel id="cardStyle-label">Card Style</InputLabel>
          <Select
            labelId={'cardStyle-label'}
            id="cardStyle"
            name="cardStyle"
            value={fields.cardStyle.value}
            label="Card Style"
            onChange={fields.cardStyle.onChange as any}
          >
            {cardStyles.map(cardStyle => (
              <MenuItem key={cardStyle.id} value={cardStyle.id}>
                {cardStyle.labels.en}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{fields.cardStyle.helperText}</FormHelperText>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              name="businessEnabled"
              checked={!!data.businessEnabled}
              disabled={saving}
              {...omit(
                fieldProps('businessEnabled', {
                  format: value => value ?? null,
                }),
                'error',
                'helperText',
              )}
            />
          }
          label="Business Enabled"
        />
        <FormControlLabel
          control={
            <Switch
              name="personalEnabled"
              checked={!!data.personalEnabled}
              disabled={saving}
              {...omit(
                fieldProps('personalEnabled', {
                  format: value => value ?? null,
                }),
                'error',
                'helperText',
              )}
            />
          }
          label="Personal Enabled"
        />
        <Button
          type="submit"
          variant="contained"
          disabled={saving || modulesLoading}
        >
          Save
        </Button>
        {error?.formErrors.map(formError => (
          <Typography key={formError} variant="body1" color="error">
            {formError}
          </Typography>
        ))}
      </Box>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="CardTemplate saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </div>
  );
};

export default CardTemplateForm;
