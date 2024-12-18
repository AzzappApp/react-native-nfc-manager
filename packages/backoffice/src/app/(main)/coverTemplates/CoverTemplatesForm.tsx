'use client';

import { StarsSharp } from '@mui/icons-material';
import { Typography, Breadcrumbs, Link, Box, Tabs, Tab } from '@mui/material';

import { useState } from 'react';
import CoverTemplatesParametersForm from './CoverTemplatesParametersForm';
import CoverTemplatePreviews from './CoverTemplatesPreviews';
import type { ActivityItem } from './[id]/page';

import type {
  ColorPalette,
  CoverTemplate,
  CoverTemplatePreview,
  CoverTemplateTag,
  CoverTemplateType,
} from '@azzapp/data';

type Tabs = 'configuration' | 'previews';

const TABS: Tabs[] = ['configuration', 'previews'];

type CoverTemplateFormProps = {
  coverTemplate?: CoverTemplate;
  coverTemplateTags: Array<CoverTemplateTag & { label: string }>;
  colorPalettes: ColorPalette[];
  coverTemplateTypes: Array<CoverTemplateType & { label: string }>;
  coverTemplatePreviews?: CoverTemplatePreview[];
  activities?: ActivityItem[];
  saved?: boolean;
};

const CoverTemplateForm = ({
  coverTemplate,
  colorPalettes,
  coverTemplateTypes,
  coverTemplateTags,
  coverTemplatePreviews,
  activities,
  saved = false,
}: CoverTemplateFormProps) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, index: number) => {
    setSelectedTab(index);
  };

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/coverTemplates"
        >
          <StarsSharp sx={{ mr: 0.5 }} fontSize="inherit" />
          Cover templates
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {coverTemplate
          ? `CoverTemplate : ${coverTemplate.name}`
          : 'New CoverTemplate'}
      </Typography>

      {coverTemplate && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleChange}>
            <Tab
              label="Configuration"
              id="configuration"
              aria-controls="configuration"
            />
            <Tab
              label="Activities Previews"
              id="previews"
              aria-controls="previews"
            />
          </Tabs>
        </Box>
      )}

      <Box sx={{ height: 'calc(100% - 170px)', mt: 2 }}>
        {TABS[selectedTab] === 'configuration' && (
          <CoverTemplatesParametersForm
            coverTemplate={coverTemplate}
            colorPalettes={colorPalettes}
            coverTemplateTypes={coverTemplateTypes}
            coverTemplateTags={coverTemplateTags}
            saved={saved}
          />
        )}

        {TABS[selectedTab] === 'previews' &&
          coverTemplate &&
          coverTemplatePreviews &&
          activities && (
            <CoverTemplatePreviews
              coverTemplate={coverTemplate}
              coverTemplatePreviews={coverTemplatePreviews}
              activities={activities}
            />
          )}
      </Box>
    </>
  );
};

export default CoverTemplateForm;
