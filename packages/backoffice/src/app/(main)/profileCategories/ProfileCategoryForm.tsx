'use client';

import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  Snackbar,
} from '@mui/material';
import { omit } from 'lodash';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { uploadMedia } from '@azzapp/shared/WebAPI';
import { getSignedUpload } from '#app/mediaActions';
import MediasListInput from '#components/MediasListInput';
import { intParser, labelsOptions, useForm } from '#helpers/formHelpers';
import WebCardTemplateTypeListInput from '../companyActivities/WebCardTemplateTypeListInput';
import ActivityListInput from './ActivityListInput';
import { saveProfileCategory } from './profileCategoriesActions';
import type { ProfileCategoryErrors } from './profileCategorySchema';
import type {
  CardTemplateType,
  CompanyActivity,
  ProfileCategory,
} from '@azzapp/data/domains';

type ProfileCategoryFormProps = {
  profileCategory?: ProfileCategory | null;
  companyActivities: CompanyActivity[];
  cardTemplateTypes: CardTemplateType[];
  categoryCompanyActivities?: string[];
  saved?: boolean;
};

type FormValue = Omit<ProfileCategory, 'medias'> & {
  medias: Array<File | string>;
  activities: Array<CompanyActivity | string>;
  cardTemplateType: CardTemplateType | string;
};

const ProfileCategoryForm = ({
  profileCategory,
  companyActivities,
  cardTemplateTypes,
  categoryCompanyActivities,
  saved = false,
}: ProfileCategoryFormProps) => {
  const isCreation = !profileCategory;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<ProfileCategoryErrors | null>(
    null,
  );
  const { data, fieldProps } = useForm<FormValue>(
    () =>
      profileCategory
        ? {
            ...profileCategory,
            activities:
              categoryCompanyActivities?.map(
                id =>
                  companyActivities.find(activity => activity.id === id) ?? id,
              ) ?? [],
            cardTemplateType: profileCategory?.cardTemplateTypeId
              ? cardTemplateTypes?.find(item => {
                  return item.id === profileCategory?.cardTemplateTypeId;
                })
              : undefined,
          }
        : { enabled: true },
    formErrors?.fieldErrors,
    [profileCategory, categoryCompanyActivities],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const medias = data?.medias ?? [];
    const mediasToSave: string[] = [];

    const mediasToUpload = convertToNonNullArray(
      medias.map((media, index) => {
        if (typeof media === 'string') {
          mediasToSave[index] = media;
          return null;
        }
        return {
          index,
          file: media,
        };
      }),
    );

    if (mediasToUpload.length > 0) {
      setUploading(true);

      let uploads: Array<{ id: string; index: number }>;
      try {
        const uploadsInfos = await Promise.all(
          mediasToUpload.map(() => getSignedUpload('image', 'cover')),
        );

        uploads = await Promise.all(
          mediasToUpload.map(({ file, index: mediaIndex }, index) => {
            const { uploadURL, uploadParameters } = uploadsInfos[index];
            return uploadMedia(file, uploadURL, uploadParameters).promise.then(
              ({ public_id }) => ({
                id: encodeMediaId(public_id, 'image'),
                index: mediaIndex,
              }),
            );
          }),
        );
      } catch (error) {
        setError(error);
        setIsSaving(false);
        setUploading(false);
        return;
      }

      uploads.forEach(({ id, index }) => {
        mediasToSave[index] = id;
      });
      setUploading(false);
    }

    try {
      const result = await saveProfileCategory({
        ...data,
        medias: mediasToSave,
      } as any);

      if (result.success) {
        setFormErrors(null);
        if (isCreation) {
          router.replace(
            `/profileCategories/${result.profileCategoryId}?saved=true`,
          );
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

  const profileKindProps = fieldProps('profileKind');

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 10 }}>
        {profileCategory
          ? `ProfileCategory : ${profileCategory.labels.en}`
          : 'New ProfileCategory'}
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
        <FormControl fullWidth error={profileKindProps.error}>
          <InputLabel id="profileKind-label">Profile Kind</InputLabel>
          <Select
            labelId={'profileKind-label'}
            id="profileKind"
            name="profileKind"
            value={profileKindProps.value}
            label="Profile Kind"
            onChange={profileKindProps.onChange as any}
          >
            <MenuItem value="personal">Personal</MenuItem>
            <MenuItem value="business">Business</MenuItem>
          </Select>
          <FormHelperText>{profileKindProps.helperText}</FormHelperText>
        </FormControl>
        <TextField
          name="fontSize"
          type="number"
          label="Order"
          disabled={saving}
          required
          {...fieldProps('order', { parse: intParser })}
        />
        <WebCardTemplateTypeListInput
          label="Webcard template type"
          name="cardTemplateType"
          options={cardTemplateTypes}
          {...fieldProps('cardTemplateType')}
        />
        {data.profileKind === 'business' && (
          <ActivityListInput
            label="Activities"
            name="activities"
            options={companyActivities}
            {...fieldProps('activities')}
          />
        )}
        <MediasListInput
          label="Medias"
          name="medias"
          kind="image"
          {...fieldProps('medias')}
        />
        <FormControlLabel
          control={
            <Switch
              name="enabled"
              checked={!!data.enabled}
              disabled={saving}
              {...omit(
                fieldProps('enabled', { format: value => value ?? null }),
                'error',
                'helperText',
              )}
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
      <Dialog open={uploading}>
        <DialogContent>Uploading ...</DialogContent>
      </Dialog>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="ProfileCategory saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default ProfileCategoryForm;
