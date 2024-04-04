'use client';

import {
  Box,
  Button,
  Dialog,
  DialogContent,
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
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { uploadMedia } from '@azzapp/shared/WebAPI';
import { getSignedUpload } from '#app/mediaActions';
import MediaInput from '#components/MediaInput';
import { useForm } from '#helpers/formHelpers';
import WebCardTemplateTypeListInput from '../companyActivities/WebCardTemplateTypeListInput';
import { getModulesData, saveCardTemplate } from './cardTemplatesActions';
import type {
  CardTemplateErrors,
  CardTemplateFormValue,
} from './cardTemplateSchema';
import type {
  CardStyle,
  CardTemplate,
  CardTemplateType,
  Label,
} from '@azzapp/data';

type CoverTemplateFormProps = {
  cardTemplate?: CardTemplate;
  cardTemplateTypes: CardTemplateType[];
  cardStyles: CardStyle[];
  label?: Label | null;
  labels: Label[];
};

const CardTemplateForm = ({
  cardStyles,
  cardTemplate,
  cardTemplateTypes,
  label,
  labels,
}: CoverTemplateFormProps) => {
  const isCreation = !cardTemplate;

  const [webCardUserName, setWebCardUserName] = useState<string | null>(null);
  const [modulesLoading, loadModules] = useTransition();
  const [modulesError, setModulesError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormError] = useState<CardTemplateErrors | null>(null);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(false);

  type Data = Omit<CardTemplateFormValue, 'previewMediaId'> & {
    previewMediaId: File | string | null;
    cardTemplateType: CardTemplateType | undefined;
  };
  const { data, setData, fieldProps } = useForm<Data>(
    () => {
      if (cardTemplate) {
        return {
          labelKey: label?.labelKey ?? '',
          baseLabelValue: label?.baseLabelValue ?? '',
          cardStyle: cardTemplate.cardStyleId!,
          modules: cardTemplate.modules,
          businessEnabled: cardTemplate.businessEnabled,
          personalEnabled: cardTemplate.personalEnabled,
          previewMediaId: cardTemplate.previewMediaId,
          cardTemplateType: cardTemplate?.cardTemplateTypeId
            ? cardTemplateTypes?.find(item => {
                return item.id === cardTemplate?.cardTemplateTypeId;
              })
            : undefined,
        };
      }
      return {
        businessEnabled: true,
        personalEnabled: true,
      };
    },
    formErrors?.fieldErrors,
    [],
  );

  const handleFetchModules = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (modulesLoading || !webCardUserName) return;

    loadModules(async () => {
      setModulesError(null);
      const modulesData = await getModulesData(webCardUserName);
      if (!modulesData)
        setModulesError(
          `Unable to find modules related to webCard ${webCardUserName}`,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSaving(true);

    let previewMediaId: string;
    if (data.previewMediaId instanceof File) {
      const file = data.previewMediaId;
      setUploading(true);
      let public_id: string;
      try {
        const { uploadURL, uploadParameters } = await getSignedUpload(
          'image',
          'module',
        );
        ({ public_id } = await uploadMedia(file, uploadURL, uploadParameters)
          .promise);
        setUploading(false);
      } catch (error) {
        setError(error);
        setSaving(false);
        setUploading(false);
        return;
      }

      previewMediaId = encodeMediaId(public_id, 'image');
    } else {
      previewMediaId = data.previewMediaId as any;
    }

    setFormError(null);

    try {
      const { success, formErrors } = await saveCardTemplate(
        {
          ...data,
          previewMediaId,
        },
        cardTemplate?.id,
      );
      if (!success) {
        setFormError(formErrors);
      } else {
        setDisplaySaveSuccess(true);
      }
    } catch (error) {
      setError(error);
      setSaving(false);
      return;
    }
  };

  const fields = {
    labelKey: fieldProps('labelKey'),
    baseLabelValue: fieldProps('baseLabelValue'),
    cardStyle: fieldProps('cardStyle'),
    businessEnabled: fieldProps('businessEnabled'),
    personalEnabled: fieldProps('personalEnabled'),
  };

  return (
    <div>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {cardTemplate
          ? `CardTemplate : ${label?.baseLabelValue}`
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
              href={`${process.env.NEXT_PUBLIC_FRONTEND}/${webCardUserName}`}
            >
              ({data.modules.length})
            </Link>
          )}
        </Typography>
        <TextField
          name="baseProfileUserName"
          label="WebCard name"
          required
          fullWidth
          onChange={e => setWebCardUserName(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Load
        </Button>
        {formErrors?.fieldErrors.modules && (
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
        <TextField
          name="labelKey"
          label="Label key"
          disabled={saving || !isCreation}
          required
          fullWidth
          {...fields.labelKey}
        />
        <TextField
          name="baseLabelValue"
          label="Label default value"
          required
          fullWidth
          {...fields.baseLabelValue}
        />
        <WebCardTemplateTypeListInput
          label="Webcard template type"
          name="cardTemplateType"
          options={cardTemplateTypes}
          cardTemplateTypesLabels={labels}
          {...fieldProps('cardTemplateType')}
        />
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
                {labels.find(label => label.labelKey === cardStyle.labelKey)
                  ?.baseLabelValue ?? cardStyle.labelKey}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{fields.cardStyle.helperText}</FormHelperText>
        </FormControl>
        {/*@ts-expect-error bad type */}
        <MediaInput
          label="Preview Media"
          name="previewMedia"
          kind="image"
          {...fieldProps('previewMediaId', {
            format: (value: File | string | null | undefined) =>
              typeof value === 'string'
                ? {
                    id: value,
                    kind: 'image' as const,
                  }
                : value ?? null,
          })}
        />
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
        {error && (
          <Typography variant="body1" color="error">
            Something went wrong {error?.message}
          </Typography>
        )}
      </Box>
      <Dialog open={uploading}>
        <DialogContent>Uploading ...</DialogContent>
      </Dialog>
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
