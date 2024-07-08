import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '#theme';
import Text from '#ui/Text';
import ProgressBar from './ProgressBar';
import type { Subscription, Observable } from 'relay-runtime';

const UploadProgressModal = ({
  progressIndicator,
  text,
}: {
  progressIndicator?: Observable<number> | null;
  text?: string;
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

  const windowWidth = useWindowDimensions().width;

  const intl = useIntl();
  text =
    text ??
    intl.formatMessage({
      defaultMessage: 'Saving...',
      description:
        'Default message displaying in upload modal when uploading a file',
    });

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
      <Text variant="button" style={styles.text}>
        {text}
      </Text>
      <ProgressBar
        progress={progress ?? 0}
        style={[styles.progressBarWidth, progress === null && { opacity: 0 }]}
      />
    </View>
  );
};

export default UploadProgressModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    width: '75%',
    textAlign: 'center',
    lineHeight: 36,
  },
  progressBarWidth: { width: '75%' },
});
