import { Suspense, forwardRef, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { colors } from '#theme';
import CoverEditor from '#components/CoverEditor';
import CoverEditorContextProvider from '#components/CoverEditor/CoverEditorContext';
import CoverEditorTemplateList from '#components/CoverEditor/templateList/CoverEditorTemplateList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
// import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import type { TemplateTypePreview } from '#components/CoverEditor/templateList/CoverEditorTemplateTypePreviews';
import type { CoverEditionStepQuery } from '#relayArtifacts/CoverEditionStepQuery.graphql';
import type { ForwardedRef } from 'react';

type CoverEditionStepProps = {
  profileId: string;
  height: number;
  onCoverSaved: () => void;
  setCanSave: (value: boolean) => void;
};

export type CoverEditorHandle = {
  save: () => void;
};

const CoverEditionStep = (
  {
    height,
    profileId,
    // onCoverSaved,
    // setCanSave,
  }: CoverEditionStepProps,
  ref: ForwardedRef<CoverEditorHandle>,
) => {
  const [coverTemplatePreview, setCoverTemplatePreview] =
    useState<TemplateTypePreview | null>(null);

  const data = useLazyLoadQuery<CoverEditionStepQuery>(
    graphql`
      query CoverEditionStepQuery($profileId: ID!) {
        profile: node(id: $profileId) {
          ...CoverEditorTemplateList_profile
          ...useTemplateCover_coverTemplates
          ...CoverEditor_profile
        }
      }
    `,
    { profileId },
  );

  useImperativeHandle(ref, () => ({
    save: () => {
      console.log('save');
    },
  }));

  // const insets = useScreenInsets();

  const styles = useStyleSheet(stylesheet);

  return (
    <View style={{ height }}>
      <Suspense
        fallback={
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator />
          </View>
        }
      >
        <View style={{ flex: 1 }}>
          {data.profile && !coverTemplatePreview && (
            <CoverEditorTemplateList
              profile={data.profile}
              coverTemplates={data.profile}
              onSelectCoverTemplatePreview={setCoverTemplatePreview}
            />
          )}
          {data.profile && coverTemplatePreview && (
            <CoverEditorContextProvider>
              <CoverEditor
                profile={data.profile}
                coverTemplatePreview={coverTemplatePreview}
              />
            </CoverEditorContextProvider>
          )}
        </View>
      </Suspense>
    </View>
  );
};

export default forwardRef(CoverEditionStep);

const SUBTITLE_HEIGHT = 42;

const stylesheet = createStyleSheet(appearance => ({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitleContainer: {
    height: SUBTITLE_HEIGHT,
    justifyContent: 'center',
  },
  subTitle: {
    textAlign: 'center',
    marginHorizontal: 40,
    color: appearance === 'dark' ? colors.white : colors.grey900,
  },
  saveButton: {
    marginTop: 16,
    marginHorizontal: 25,
  },
}));
