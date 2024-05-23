import { Suspense, forwardRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Text from '#ui/Text';
import type { ForwardedRef } from 'react';

type CoverEditionStepProps = {
  profileId: string;
  height: number;
  onCoverSaved: () => void;
  setCanSave: (value: boolean) => void;
};

const CoverEditionStep = (
  { height }: CoverEditionStepProps,
  _forwardRef: ForwardedRef<any>,
) => {
  const insets = useScreenInsets();

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
        <View style={{ flex: 1, paddingBottom: Math.min(insets.bottom, 16) }} />
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
