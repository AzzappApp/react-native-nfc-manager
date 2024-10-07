'use client';

import { People } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  Link,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from '#helpers/formHelpers';
import TypeListInput from '../../../components/TypeListInput';
import { saveCompanyActivity } from './companyActivityActions';
import type { CompanyActivityErrors } from './companyActivitySchema';
import type {
  CompanyActivity,
  CardTemplateType,
  CompanyActivityType,
  LocalizationMessage,
} from '@azzapp/data';

type CompanyActivityFormProps = {
  companyActivity?: CompanyActivity | null;
  cardTemplateTypes: CardTemplateType[];
  companyActivitiesTypes: CompanyActivityType[];
  saved?: boolean;
  labels: LocalizationMessage[];
};

type FormValue = {
  label: string;
  cardTemplateTypeId: string | null;
  companyActivityTypeId: string | null;
};

const CompanyActivityForm = ({
  companyActivity,
  saved = false,
  cardTemplateTypes,
  companyActivitiesTypes,
  labels,
}: CompanyActivityFormProps) => {
  const isCreation = !companyActivity;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<string>();
  const [formErrors, setFormErrors] = useState<CompanyActivityErrors | null>(
    null,
  );

  const label = useMemo(
    () =>
      companyActivity
        ? labels.find(item => item.key === companyActivity.id)?.value
        : undefined,
    [companyActivity, labels],
  );

  const { data, fieldProps } = useForm<FormValue>(
    () => {
      return {
        label: label || '',
        cardTemplateTypeId: companyActivity?.cardTemplateTypeId ?? null,
        companyActivityTypeId: companyActivity?.companyActivityTypeId ?? null,
      };
    },
    formErrors?.fieldErrors,
    [companyActivity],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await saveCompanyActivity(
      (isCreation
        ? data
        : {
            id: companyActivity?.id,
            ...data,
          }) as FormValue,
    );
    if (result.success) {
      setFormErrors(null);
      if (isCreation) {
        router.replace(
          `/companyActivities/${result.companyActivityId}?saved=true`,
        );
      } else {
        setDisplaySaveSuccess(true);
      }
    } else if (!result.success) {
      setFormErrors(result.formErrors || null);
      setError(result.message);
    }
    setIsSaving(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
      }}
      component="form"
      onSubmit={handleSubmit}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/companyActivities"
        >
          <People sx={{ mr: 0.5 }} fontSize="inherit" />
          Activities
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {companyActivity ? `Company activity ${label}` : 'New Company Activity'}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          width: '100%',
          mb: 2,
        }}
      >
        <TextField
          name="label"
          label="Label (en-US)"
          disabled={saving}
          required
          sx={{ flex: 1, minWidth: 200 }}
          {...fieldProps('label')}
        />
      </Box>
      {/* @ts-expect-error this component types are fucked */}
      <TypeListInput
        label="Webcard template type"
        name="cardTemplateType"
        options={cardTemplateTypes}
        typesLabels={labels}
        sx={{ flex: 1, minWidth: 200 }}
        {...fieldProps('cardTemplateTypeId', {
          format: value =>
            value
              ? (cardTemplateTypes.find(t => t.id === value) ?? null)
              : null,
          parse: value =>
            (typeof value === 'string' ? value : value?.id) ?? null,
        })}
      />
      {/* @ts-expect-error this component types are fucked */}
      <TypeListInput
        label="Activity Type"
        name="companyActivityType"
        options={companyActivitiesTypes}
        typesLabels={labels}
        sx={{ flex: 1, minWidth: 200 }}
        {...fieldProps('companyActivityTypeId', {
          format: value =>
            value
              ? (companyActivitiesTypes.find(t => t.id === value) ?? null)
              : null,
          parse: value =>
            (typeof value === 'string' ? value : value?.id) ?? null,
        })}
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
          {error}
        </Typography>
      )}
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="Company Activity saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CompanyActivityForm;
