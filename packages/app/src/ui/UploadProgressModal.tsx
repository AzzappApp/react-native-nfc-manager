import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '#theme';
import Text from '#ui/Text';
import Button from './Button';
import ProgressBar from './ProgressBar';
import type { ViewProps } from 'react-native';
import type { Subscription, Observable } from 'relay-runtime';

const UploadProgressModal = ({
  progressIndicator,
  progressIndicators,
  text,
  texts,
  onCancel,
}: {
  progressIndicator?: Observable<number> | null;
  progressIndicators?: Array<Observable<number> | null> | null;
  text?: string;
  texts?: string[];
  onCancel?: () => void;
}) => {
  const windowWidth = useWindowDimensions().width;

  const intl = useIntl();
  text =
    text ??
    intl.formatMessage({
      defaultMessage: 'Saving...',
      description:
        'Default message displaying in upload modal when uploading a file',
    });

  const nbProgressPars = progressIndicators?.length ?? 1;
  const elementsWidth =
    (windowWidth * 0.62 - (nbProgressPars - 1) * 2) / nbProgressPars;
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/loader.json')}
        autoPlay
        loop
        hardwareAccelerationAndroid
        style={{
          width: windowWidth / 2,
          height: windowWidth / 2,
          marginTop: -100,
        }}
      />
      <View style={styles.elementsContainer}>
        {(texts ?? [text]).map((text, index) => (
          <Text key={index} style={[styles.text, { width: elementsWidth }]}>
            {text}
          </Text>
        ))}
      </View>
      <View style={styles.elementsContainer}>
        {(progressIndicators ?? [progressIndicator]).map(
          (progressIndicator, index, { length }) => (
            <ObservableBoundProgressBar
              key={index}
              progressIndicator={progressIndicator}
              hideWhenNull={length === 1}
              style={{ width: elementsWidth }}
            />
          ),
        )}
      </View>
      {onCancel && (
        <View style={styles.cancelButtonContainer}>
          <Button
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button in upload modal',
            })}
            appearance="dark"
          />
        </View>
      )}
    </View>
  );
};

export default UploadProgressModal;

const ObservableBoundProgressBar = ({
  progressIndicator,
  hideWhenNull = true,
  style,
  ...props
}: ViewProps & {
  hideWhenNull?: boolean;
  progressIndicator: Observable<number> | null | undefined;
}) => {
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    let subscription: Subscription;
    if (progressIndicator) {
      setProgress(0);
      subscription = progressIndicator.subscribe({
        next(value) {
          setProgress(value);
        },
      });
    }
    return () => {
      subscription?.unsubscribe();
      setProgress(null);
    };
  }, [progressIndicator]);

  return (
    <ProgressBar
      progress={progress ?? 0}
      {...props}
      style={[style, { opacity: progress === null && hideWhenNull ? 0 : 1 }]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elementsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  text: {
    color: colors.white,
    textAlign: 'center',
    lineHeight: 36,
  },
  cancelButtonContainer: {
    bottom: 42,
    left: 0,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
  },
});
