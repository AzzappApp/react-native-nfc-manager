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
import { useState } from 'react';
import { useForm } from '#helpers/formHelpers';
import { saveCompanyActivitiesType } from './companyActivitiesTypeActions';
import type { CompanyActivitiesTypeErrors } from './companyActivitiesTypeSchema';
import type { CompanyActivityType } from '@azzapp/data';

type CompanyActivityTypeFormProps = {
  companyActivitiesType?: CompanyActivityType | null;
  saved?: boolean;
  label?: string;
};

type FormValue = CompanyActivityType & { label: string };

const CompanyActivitiesTypeForm = ({
  companyActivitiesType,
  saved = false,
  label,
}: CompanyActivityTypeFormProps) => {
  const isCreation = !companyActivitiesType;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<string>();
  const [formErrors, setFormErrors] =
    useState<CompanyActivitiesTypeErrors | null>(null);

  const { data, fieldProps } = useForm<FormValue>(
    () => ({
      label,
      ...companyActivitiesType,
    }),
    formErrors?.fieldErrors,
    [companyActivitiesType],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await saveCompanyActivitiesType({
      id: companyActivitiesType?.id,
      label: data.label!,
    });
    if (result.success) {
      setFormErrors(null);
      if (isCreation) {
        router.replace(
          `/companyActivitiesTypes/${result.companyActivityId}?saved=true`,
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
          href="/companyActivitiesTypes"
        >
          <People sx={{ mr: 0.5 }} fontSize="inherit" />
          Activities Types
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {companyActivitiesType
          ? `Company activities type ${label}`
          : 'New Company Activities type'}
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
          disabled={saving || !isCreation}
          required
          sx={{ flex: 1, minWidth: 200 }}
          {...fieldProps('label')}
        />
      </Box>
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

export default CompanyActivitiesTypeForm;
