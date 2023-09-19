import { Suspense, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { colors } from '#theme';
import CoverEditor from '#components/CoverEditor';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button, { BUTTON_HEIGHT } from '#ui/Button';
import Text from '#ui/Text';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { CoverEditionStepQuery } from '@azzapp/relay/artifacts/CoverEditionStepQuery.graphql';
import type { ProfileKind } from '@azzapp/relay/artifacts/NewProfileScreenQuery.graphql';

type CoverEditionStepProps = {
  profileKind: ProfileKind;
  height: number;
  onCoverSaved: () => void;
};

const CoverEditionStep = ({
  profileKind,
  height,
  onCoverSaved,
}: CoverEditionStepProps) => {
  const data = useLazyLoadQuery<CoverEditionStepQuery>(
    graphql`
      query CoverEditionStepQuery {
        viewer {
          ...CoverEditor_viewer
          ...CoverEditor_suggested
        }
      }
    `,
    {
      initialTemplateKind: profileKind === 'business' ? 'others' : 'people',
    },
  );

  const [canSave, setCanSave] = useState(true);

  const ref = useRef<CoverEditorHandle>(null);
  const onSave = () => {
    ref.current?.save();
  };

  const intl = useIntl();

  const insets = useScreenInsets();
  const eidtorHeight =
    height - SUBTITLE_HEIGHT - BUTTON_HEIGHT - 16 - Math.min(insets.bottom, 16);

  return (
    <View style={{ height }}>
      <Suspense
        fallback={
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator />
          </View>
        }
      >
        <View style={styles.subTitleContainer}>
          <Text variant="medium" style={styles.subTitle}>
            <FormattedMessage
              defaultMessage="The cover is the first and most visible section of your WebCard{azzappA}"
              description="New profile - cover creation subtitle"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
        </View>
        <View style={{ flex: 1, paddingBottom: Math.min(insets.bottom, 16) }}>
          <CoverEditor
            ref={ref}
            viewer={data.viewer}
            height={eidtorHeight}
            onCoverSaved={onCoverSaved}
            onCanSaveChange={setCanSave}
            initialTemplateKind={
              profileKind === 'business' ? 'others' : 'people'
            }
          />
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Save my cover',
              description: 'Cover editor save button label',
            })}
            style={styles.saveButton}
            onPress={onSave}
            disabled={!canSave}
          />
        </View>
      </Suspense>
    </View>
  );
};

export default CoverEditionStep;

const SUBTITLE_HEIGHT = 56;

const styles = StyleSheet.create({
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
    color: colors.grey900,
  },
  saveButton: {
    marginTop: 16,
    marginHorizontal: 25,
  },
});
