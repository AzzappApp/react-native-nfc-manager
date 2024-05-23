import { Suspense, forwardRef, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { colors } from '#theme';
import CoverEditorContextProvider from '#components/CoverEditorV2/CoverEditorContext';
import CoverEditorV2 from '#components/CoverEditorV2/CoverEditorV2';
import CoverEditorV2TemplateList from '#components/CoverEditorV2/templateList/CoverEditorV2TemplateList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
// import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { CoverEditionStepV2Query } from '#relayArtifacts/CoverEditionStepV2Query.graphql';
import type { ForwardedRef } from 'react';

type CoverEditionStepProps = {
  profileId: string;
  height: number;
  onCoverSaved: () => void;
  setCanSave: (value: boolean) => void;
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
  const [coverTemplatePreview, setCoverTemplatePreview] = useState<
    string | null
  >(null);

  const data = useLazyLoadQuery<CoverEditionStepV2Query>(
    graphql`
      query CoverEditionStepV2Query($profileId: ID!) {
        profile: node(id: $profileId) {
          ...CoverEditorV2TemplateList_profile
          ...useTemplateCover_coverTemplates
          ...CoverEditorV2_profile
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
            <CoverEditorV2TemplateList
              profile={data.profile}
              coverTemplates={data.profile}
              onSelectCoverTemplatePreview={setCoverTemplatePreview}
            />
          )}
          {data.profile && coverTemplatePreview && (
            <CoverEditorContextProvider>
              <CoverEditorV2 profile={data.profile} />
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
